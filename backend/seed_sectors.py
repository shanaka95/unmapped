"""Seed the sectors table with entries mapped to their ILO sectors."""

from sqlalchemy import select

from app.database import SessionLocal
from app.models import IloSector, Sector


SECTORS = [
    {
        "title": "Crop Farming & Plantations",
        "description": "Cultivation of field crops, fruits, vegetables, and plantation crops including tea, coffee, rubber, and sugarcane.",
        "ilo_sector_id": 1,
    },
    {
        "title": "Livestock & Animal Husbandry",
        "description": "Rearing of cattle, poultry, dairy farming, aquaculture, and other animal-based agricultural production.",
        "ilo_sector_id": 1,
    },
    {
        "title": "Iron & Steel Manufacturing",
        "description": "Production of iron, steel, and ferro-alloys including smelting, casting, rolling, and finishing operations.",
        "ilo_sector_id": 2,
    },
    {
        "title": "Non-Ferrous Metal Production",
        "description": "Manufacturing of aluminium, copper, zinc, lead, and other non-ferrous metals through extraction and refining.",
        "ilo_sector_id": 2,
    },
    {
        "title": "Industrial Chemicals & Petrochemicals",
        "description": "Manufacturing of basic chemicals, fertilizers, plastics, synthetic resins, and petrochemical derivatives.",
        "ilo_sector_id": 3,
    },
    {
        "title": "Pharmaceuticals & Fine Chemicals",
        "description": "Production of medicines, active pharmaceutical ingredients, vaccines, and specialty chemical compounds.",
        "ilo_sector_id": 3,
    },
    {
        "title": "Retail & Wholesale Trade",
        "description": "Buying and selling of goods through retail outlets, wholesale distribution, e-commerce, and trading companies.",
        "ilo_sector_id": 4,
    },
    {
        "title": "Import & Export Services",
        "description": "International trade operations including customs brokerage, freight forwarding, and cross-border commodity trading.",
        "ilo_sector_id": 4,
    },
    {
        "title": "Building & Civil Construction",
        "description": "Construction of residential, commercial, and industrial buildings, including architecture and project management.",
        "ilo_sector_id": 5,
    },
    {
        "title": "Infrastructure & Heavy Construction",
        "description": "Construction of roads, bridges, dams, tunnels, airports, and other large-scale public infrastructure projects.",
        "ilo_sector_id": 5,
    },
    {
        "title": "Higher Education & Universities",
        "description": "Degree-granting institutions, universities, colleges, and professional education programs.",
        "ilo_sector_id": 6,
    },
    {
        "title": "Scientific Research & Development",
        "description": "Laboratories, research institutions, and R&D organizations conducting applied and fundamental scientific research.",
        "ilo_sector_id": 6,
    },
    {
        "title": "Banking & Financial Services",
        "description": "Commercial banking, investment banking, asset management, insurance, and fintech services.",
        "ilo_sector_id": 7,
    },
    {
        "title": "Legal, Accounting & Consulting",
        "description": "Professional services including law firms, accounting practices, management consulting, and advisory services.",
        "ilo_sector_id": 7,
    },
    {
        "title": "Food Processing & Manufacturing",
        "description": "Processing, preservation, and packaging of food products including dairy, meat, bakery, and beverage production.",
        "ilo_sector_id": 8,
    },
    {
        "title": "Beverage & Tobacco Production",
        "description": "Manufacturing of alcoholic and non-alcoholic beverages, bottled water, and tobacco product processing.",
        "ilo_sector_id": 8,
    },
    {
        "title": "Timber & Wood Products",
        "description": "Logging, sawmilling, wood treatment, and manufacturing of wooden furniture, fixtures, and building materials.",
        "ilo_sector_id": 9,
    },
    {
        "title": "Pulp, Paper & Packaging",
        "description": "Production of pulp, paper, cardboard, and packaging materials from wood and recycled fiber sources.",
        "ilo_sector_id": 9,
    },
    {
        "title": "Hospitals & Clinical Services",
        "description": "General and specialized hospitals, clinics, diagnostic centers, and surgical care facilities.",
        "ilo_sector_id": 10,
    },
    {
        "title": "Public Health & Community Care",
        "description": "Community health services, preventive care, mental health facilities, rehabilitation centers, and elder care.",
        "ilo_sector_id": 10,
    },
    {
        "title": "Hotels & Accommodation",
        "description": "Hotels, resorts, guesthouses, hostels, and other short-term lodging and hospitality services.",
        "ilo_sector_id": 11,
    },
    {
        "title": "Restaurants & Catering",
        "description": "Restaurants, cafes, bars, event catering, food delivery, and other food service operations.",
        "ilo_sector_id": 11,
    },
    {
        "title": "Machinery & Equipment Manufacturing",
        "description": "Production of industrial machinery, machine tools, pumps, compressors, and mechanical equipment.",
        "ilo_sector_id": 12,
    },
    {
        "title": "Electrical Equipment & Electronics",
        "description": "Manufacturing of electrical components, generators, transformers, wires, cables, and electronic assemblies.",
        "ilo_sector_id": 12,
    },
    {
        "title": "Broadcasting & Digital Media",
        "description": "Television, radio, streaming platforms, podcasting, and digital content production and distribution.",
        "ilo_sector_id": 13,
    },
    {
        "title": "Publishing & Printing",
        "description": "Book, newspaper, and magazine publishing, graphic design, commercial printing, and content distribution.",
        "ilo_sector_id": 13,
    },
    {
        "title": "Coal Mining & Extraction",
        "description": "Surface and underground coal mining, coal preparation, and related extraction support activities.",
        "ilo_sector_id": 14,
    },
    {
        "title": "Mineral & Quarry Mining",
        "description": "Mining of metallic ores, industrial minerals, stone quarrying, and non-coal mineral extraction.",
        "ilo_sector_id": 14,
    },
    {
        "title": "Oil Exploration & Production",
        "description": "Upstream oil and gas operations including exploration, drilling, extraction, and field services.",
        "ilo_sector_id": 15,
    },
    {
        "title": "Petroleum Refining & Distribution",
        "description": "Oil refining, petrochemical feedstock production, fuel distribution, and petroleum product marketing.",
        "ilo_sector_id": 15,
    },
    {
        "title": "Textile & Apparel Manufacturing",
        "description": "Spinning, weaving, dyeing, finishing of textiles, and manufacturing of garments and clothing.",
        "ilo_sector_id": 16,
    },
    {
        "title": "Consumer Goods Manufacturing",
        "description": "Production of household products, cosmetics, toys, sports goods, and other consumer durables and non-durables.",
        "ilo_sector_id": 16,
    },
    {
        "title": "Postal & Courier Services",
        "description": "National postal services, private courier and express delivery operations, and mail processing facilities.",
        "ilo_sector_id": 17,
    },
    {
        "title": "Telecommunications & Internet",
        "description": "Mobile networks, fixed-line telephony, internet service providers, satellite communications, and data centers.",
        "ilo_sector_id": 17,
    },
    {
        "title": "Government Administration",
        "description": "Central and local government bodies, regulatory agencies, public administration, and civil service departments.",
        "ilo_sector_id": 18,
    },
    {
        "title": "Defense & Public Security",
        "description": "Armed forces, law enforcement agencies, fire services, emergency management, and national security operations.",
        "ilo_sector_id": 18,
    },
    {
        "title": "Maritime Shipping & Ports",
        "description": "Ocean freight, cargo handling, port operations, ship management, and maritime logistics services.",
        "ilo_sector_id": 19,
    },
    {
        "title": "Fisheries & Aquaculture",
        "description": "Commercial fishing, fish processing, aquaculture farming, and marine resource management.",
        "ilo_sector_id": 19,
    },
    {
        "title": "Textile Raw Materials & Yarn",
        "description": "Production and processing of cotton, wool, silk, synthetic fibers, and yarn for textile manufacturing.",
        "ilo_sector_id": 20,
    },
    {
        "title": "Leather & Footwear Manufacturing",
        "description": "Leather tanning, finishing, and manufacturing of footwear, bags, belts, and other leather goods.",
        "ilo_sector_id": 20,
    },
    {
        "title": "Civil Aviation & Airlines",
        "description": "Commercial airlines, airports, air traffic control, aircraft ground handling, and aviation support services.",
        "ilo_sector_id": 21,
    },
    {
        "title": "Road & Railway Transport",
        "description": "Passenger and freight transport via roads, highways, railways, urban transit, and logistics networks.",
        "ilo_sector_id": 21,
    },
    {
        "title": "Automotive Manufacturing",
        "description": "Manufacturing of motor vehicles, cars, trucks, buses, motorcycles, and automotive parts and components.",
        "ilo_sector_id": 22,
    },
    {
        "title": "Aerospace & Marine Equipment",
        "description": "Aircraft manufacturing, spacecraft, marine vessel construction, and related transport equipment engineering.",
        "ilo_sector_id": 22,
    },
    {
        "title": "Water Supply & Treatment",
        "description": "Water extraction, purification, distribution, wastewater treatment, and sewage management infrastructure.",
        "ilo_sector_id": 23,
    },
    {
        "title": "Electricity Generation & Distribution",
        "description": "Power generation from thermal, hydro, nuclear, and renewable sources, plus grid transmission and distribution.",
        "ilo_sector_id": 23,
    },
]


def seed():
    with SessionLocal() as session:
        existing_count = session.execute(
            select(Sector)
        ).scalars().all()

        if existing_count:
            print(f"Sectors already exist ({len(existing_count)} found). Skipping.")
            return

        # Validate all ILO sector IDs exist
        ilo_ids = {s.id for s in session.scalars(select(IloSector)).all()}
        for s in SECTORS:
            if s["ilo_sector_id"] not in ilo_ids:
                print(f"WARNING: ILO sector ID {s['ilo_sector_id']} not found for '{s['title']}'")

        records = [Sector(**data) for data in SECTORS]
        session.add_all(records)
        session.commit()
        print(f"Seeded {len(records)} sectors.")


if __name__ == "__main__":
    seed()
