from pydantic import BaseModel


class SettlementResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    settlement_type: str
    country_code: str | None
    population: float | None

    model_config = {"from_attributes": True}


class SettlementUpdate(BaseModel):
    settlement_type: str


class ClassifyRequest(BaseModel):
    latitude: float
    longitude: float


class ClassifyResponse(BaseModel):
    settlement_type: str  # "urban" | "suburban" | "rural"
    detailed_type: str | None = None


class ViewportRequest(BaseModel):
    sw_lat: float
    sw_lng: float
    ne_lat: float
    ne_lng: float
    zoom: int = 10


class GridCell(BaseModel):
    lat: float
    lng: float
    settlement_type: str
    count: int = 1
    id: int | None = None


class SettlementStats(BaseModel):
    total: int
    by_type: dict[str, int]
