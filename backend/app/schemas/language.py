from datetime import datetime

from pydantic import BaseModel


class CountryBrief(BaseModel):
    id: int
    code: str
    name: str

    model_config = {"from_attributes": True}


class LanguageResponse(BaseModel):
    id: int
    code: str
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LanguageWithCountriesResponse(BaseModel):
    id: int
    code: str
    name: str
    countries: list[CountryBrief]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
