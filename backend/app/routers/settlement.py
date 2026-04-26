import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.dependencies import get_admin_user, get_current_user, get_db
from app.models.settlement import Settlement
from app.models.user import User
from app.schemas.settlement import (
    ClassifyRequest,
    ClassifyResponse,
    GridCell,
    SettlementResponse,
    SettlementStats,
    SettlementUpdate,
)

router = APIRouter(prefix="/api/settlements", tags=["Settlements"])

TYPE_SIMPLIFIED = {
    "urban_centre": "urban",
    "dense_urban": "urban",
    "semi_dense_urban": "suburban",
    "suburban": "suburban",
    "rural_cluster": "rural",
    "rural": "rural",
}


@router.get("/viewport", response_model=list[GridCell])
def get_viewport(
    sw_lat: float = Query(...),
    sw_lng: float = Query(...),
    ne_lat: float = Query(...),
    ne_lng: float = Query(...),
    zoom: int = Query(10),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    if zoom >= 8:
        # High zoom: individual settlement cells (0.09° ≈ 10km)
        cell = 0.09
        rows = db.execute(
            text(
                "SELECT id, latitude, longitude, settlement_type "
                "FROM settlements "
                "WHERE latitude BETWEEN :sw_lat AND :ne_lat "
                "AND longitude BETWEEN :sw_lng AND :ne_lng "
                "LIMIT 10000"
            ),
            {"sw_lat": sw_lat, "sw_lng": sw_lng, "ne_lat": ne_lat, "ne_lng": ne_lng},
        ).fetchall()
        return [
            GridCell(id=r[0], lat=r[1], lng=r[2], settlement_type=r[3])
            for r in rows
        ]
    elif zoom >= 4:
        # Medium zoom: 1-degree grid with full area coverage
        rows = db.execute(
            text(
                "SELECT "
                "  FLOOR(latitude) AS lat, "
                "  FLOOR(longitude) AS lng, "
                "  settlement_type, "
                "  COUNT(*) as cnt "
                "FROM settlements "
                "WHERE latitude BETWEEN :sw_lat AND :ne_lat "
                "AND longitude BETWEEN :sw_lng AND :ne_lng "
                "GROUP BY lat, lng, settlement_type "
                "LIMIT 10000"
            ),
            {
                "sw_lat": sw_lat, "sw_lng": sw_lng,
                "ne_lat": ne_lat, "ne_lng": ne_lng,
            },
        ).fetchall()

        # Collapse to majority type per cell
        cells: dict[tuple[float, float], tuple[str, int]] = {}
        for r in rows:
            key = (r[0], r[1])
            if key not in cells or r[3] > cells[key][1]:
                cells[key] = (r[2], r[3])

        return [
            GridCell(lat=k[0], lng=k[1], settlement_type=v[0], count=v[1])
            for k, v in cells.items()
        ]
    else:
        # Low zoom: 5-degree grid for global overview
        rows = db.execute(
            text(
                "SELECT "
                "  FLOOR(latitude / 5) * 5 AS lat, "
                "  FLOOR(longitude / 5) * 5 AS lng, "
                "  settlement_type, "
                "  COUNT(*) as cnt "
                "FROM settlements "
                "WHERE latitude BETWEEN :sw_lat AND :ne_lat "
                "AND longitude BETWEEN :sw_lng AND :ne_lng "
                "GROUP BY lat, lng, settlement_type "
                "LIMIT 10000"
            ),
            {
                "sw_lat": sw_lat, "sw_lng": sw_lng,
                "ne_lat": ne_lat, "ne_lng": ne_lng,
            },
        ).fetchall()

        cells: dict[tuple[float, float], tuple[str, int]] = {}
        for r in rows:
            key = (r[0], r[1])
            if key not in cells or r[3] > cells[key][1]:
                cells[key] = (r[2], r[3])

        return [
            GridCell(lat=k[0], lng=k[1], settlement_type=v[0], count=v[1])
            for k, v in cells.items()
        ]


@router.put("/{settlement_id}", response_model=SettlementResponse)
def update_settlement(
    settlement_id: int,
    body: SettlementUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    s = db.get(Settlement, settlement_id)
    if not s:
        raise HTTPException(status_code=404, detail="Settlement not found")
    if body.settlement_type not in TYPE_SIMPLIFIED:
        raise HTTPException(status_code=400, detail="Invalid settlement type")
    s.settlement_type = body.settlement_type
    db.commit()
    db.refresh(s)
    return s


@router.post("/classify", response_model=ClassifyResponse)
def classify_location(
    body: ClassifyRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    lat = body.latitude
    lng = body.longitude

    row = db.execute(
        text(
            "SELECT settlement_type, "
            "  (latitude - :lat) * (latitude - :lat) + (longitude - :lng) * (longitude - :lng) AS dist "
            "FROM settlements "
            "WHERE latitude BETWEEN :lat - 0.5 AND :lat + 0.5 "
            "AND longitude BETWEEN :lng - 0.5 AND :lng + 0.5 "
            "ORDER BY dist "
            "LIMIT 1"
        ),
        {"lat": lat, "lng": lng},
    ).fetchone()

    if row:
        return ClassifyResponse(
            settlement_type=TYPE_SIMPLIFIED.get(row[0], "rural"),
            detailed_type=row[0],
        )

    return ClassifyResponse(settlement_type="rural", detailed_type=None)


@router.get("/stats", response_model=SettlementStats)
def get_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    total = db.scalar(text("SELECT COUNT(*) FROM settlements"))
    type_rows = db.execute(
        text("SELECT settlement_type, COUNT(*) FROM settlements GROUP BY settlement_type")
    ).fetchall()
    return SettlementStats(
        total=total or 0,
        by_type={r[0]: r[1] for r in type_rows},
    )
