import datetime

from pydantic import BaseModel


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    date_of_birth: datetime.date | None = None
    country: str | None = None
    region: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    settlement_type: str | None = None
    education_level_id: int | None = None
    education_level_name: str | None = None
    language_ids: list[int] = []
    current_step: int = 1
    is_complete: bool = False
    completion_pct: int = 0


class ProfileUpdate(BaseModel):
    date_of_birth: datetime.date | None = None
    country: str | None = None
    region: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    settlement_type: str | None = None
    education_level_id: int | None = None
    language_ids: list[int] | None = None
    current_step: int | None = None
    is_complete: bool | None = None


class CountryResponse(BaseModel):
    id: int
    code: str
    name: str


class LanguageResponse(BaseModel):
    id: int
    code: str
    name: str
