"""Seed settlements table from GHS DEGURBA dataset.

Pass A: Read shapefile centroids (UC, DUC, SDUC, RC) → convert Mollweide to WGS84
Pass B: Read 1km raster, aggregate to 10km grid → store non-water, non-duplicate cells
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import shapefile
from pyproj import Transformer
from sqlalchemy import text

from app.database import SessionLocal, engine, Base
from app.models.settlement import Settlement

GHS_DIR = "/home/shanaka/Downloads/GHS_WUP_DEGURBA_E2025_GLOBE_R2025A_54009_1000_V1_0"

# Mollweide (ESRI:54009) → WGS84 (EPSG:4326)
transformer = Transformer.from_crs("ESRI:54009", "EPSG:4326", always_xy=True)

SHAPEFILE_MAP = {
    "UC": "urban_centre",
    "DUC": "dense_urban",
    "SDUC": "semi_dense_urban",
    "RC": "rural_cluster",
}

RASTER_VALUE_MAP = {
    11: "rural",
    12: "rural",
    13: "rural_cluster",
    21: "suburban",
    22: "semi_dense_urban",
    23: "dense_urban",
    30: "urban_centre",
}

BATCH_SIZE = 10_000


def mollweide_to_wgs84(x: float, y: float):
    """Convert Mollweide (ESRI:54009) coordinates to WGS84 (lat, lng)."""
    lng, lat = transformer.transform(x, y)
    return round(lat, 6), round(lng, 6)


def seed_shapefiles():
    """Pass A: Read settlement centroids from shapefiles."""
    print("=== Pass A: Reading shapefiles ===")
    total = 0

    with SessionLocal() as session:
        for prefix, stype in SHAPEFILE_MAP.items():
            path = f"{GHS_DIR}/GHS_WUP_DEGURBA_E2025_GLOBE_R2025A_54009_1000_{prefix}_V1_0"
            sf = shapefile.Reader(path)
            fields = [f[0] for f in sf.fields[1:]]

            # Find centroid X/Y field indices
            field_names_lower = [f.lower() for f in fields]
            # PWCentroid fields — first is X, second is Y
            centroid_indices = [i for i, f in enumerate(fields) if f == "PWCentroid"]

            batch = []
            for i, rec in enumerate(sf.iterRecords()):
                cx = rec[centroid_indices[0]]
                cy = rec[centroid_indices[1]]
                lat, lng = mollweide_to_wgs84(cx, cy)

                # Get UNLocID (country code) if present
                un_loc_id = None
                if "UNLocID" in fields:
                    un_loc_id = str(rec[fields.index("UNLocID")])

                pop = None
                if "POP_2025" in fields:
                    pop = float(rec[fields.index("POP_2025")])

                batch.append(Settlement(
                    latitude=lat,
                    longitude=lng,
                    settlement_type=stype,
                    country_code=un_loc_id,
                    population=pop,
                ))

                if len(batch) >= BATCH_SIZE:
                    session.add_all(batch)
                    session.commit()
                    total += len(batch)
                    batch = []
                    print(f"  {prefix}: {total} rows inserted...", end="\r")

            if batch:
                session.add_all(batch)
                session.commit()
                total += len(batch)

            print(f"  {prefix} ({stype}): {len(sf)} settlements imported")

    print(f"Pass A complete: {total} settlements from shapefiles")
    return total


def seed_raster_grid():
    """Pass B: Read raster, aggregate to 10km grid, store non-water cells not already near shapefile settlements."""
    print("\n=== Pass B: Processing raster to 10km grid ===")
    try:
        import rasterio
        import numpy as np
    except ImportError:
        print("  rasterio/numpy not available, skipping raster pass")
        return 0

    raster_path = f"{GHS_DIR}/GHS_WUP_DEGURBA_E2025_GLOBE_R2025A_54009_1000_V1_0.tif"

    total = 0
    batch = []

    with rasterio.open(raster_path) as ds:
        width, height = ds.width, ds.height
        block_size = 10  # 10 pixels = 10km
        transform = ds.transform

        print(f"  Raster size: {width}x{height}, aggregating {block_size}x{block_size} blocks")

        for y0 in range(0, height, block_size):
            for x0 in range(0, width, block_size):
                # Read 10x10 block
                x1 = min(x0 + block_size, width)
                y1 = min(y0 + block_size, height)
                window_data = ds.read(1, window=((y0, y1), (x0, x1)))

                # Skip if all nodata or water
                valid = window_data[window_data > 0]
                if len(valid) == 0:
                    continue

                # Majority value (excluding water=10)
                non_water = valid[valid != 10]
                if len(non_water) == 0:
                    continue

                values, counts = np.unique(non_water, return_counts=True)
                majority_val = int(values[np.argmax(counts)])

                if majority_val not in RASTER_VALUE_MAP:
                    continue

                stype = RASTER_VALUE_MAP[majority_val]

                # Convert block center to WGS84
                cx_pixel = x0 + (x1 - x0) / 2
                cy_pixel = y0 + (y1 - y0) / 2
                mx, my = transform * (cx_pixel, cy_pixel)
                lat, lng = mollweide_to_wgs84(mx, my)

                batch.append(Settlement(
                    latitude=lat,
                    longitude=lng,
                    settlement_type=stype,
                ))

                if len(batch) >= BATCH_SIZE:
                    with SessionLocal() as session:
                        session.add_all(batch)
                        session.commit()
                    total += len(batch)
                    batch = []
                    print(f"  Grid cells inserted: {total}...", end="\r")

            # Commit remaining every row of blocks
            if batch and len(batch) >= BATCH_SIZE:
                with SessionLocal() as session:
                    session.add_all(batch)
                    session.commit()
                total += len(batch)
                batch = []

        if batch:
            with SessionLocal() as session:
                session.add_all(batch)
                session.commit()
            total += len(batch)

    print(f"\nPass B complete: {total} grid cells from raster")
    return total


def seed():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        existing = session.scalar(text("SELECT COUNT(*) FROM settlements"))
        if existing:
            print(f"Settlements already exist ({existing} rows). Skipping.")
            return

    count_a = seed_shapefiles()
    count_b = seed_raster_grid()
    print(f"\nDone! Total settlements: {count_a + count_b}")


if __name__ == "__main__":
    seed()
