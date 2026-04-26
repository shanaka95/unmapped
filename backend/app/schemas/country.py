from datetime import datetime

from pydantic import BaseModel


class LanguageBrief(BaseModel):
    id: int
    code: str
    name: str

    model_config = {"from_attributes": True}


class CountryResponse(BaseModel):
    id: int
    code: str
    name: str
    area: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CountryWithLanguagesResponse(BaseModel):
    id: int
    code: str
    name: str
    area: str | None
    languages: list[LanguageBrief]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
