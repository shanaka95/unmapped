from datetime import datetime

from pydantic import BaseModel, field_validator


class SectorCreate(BaseModel):
    title: str
    description: str | None = None
    ilo_sector_id: int

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title is required")
        if len(v) > 255:
            raise ValueError("Title must be 255 characters or less")
        return v


class SectorUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    ilo_sector_id: int | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Title must not be empty")
            if len(v) > 255:
                raise ValueError("Title must be 255 characters or less")
        return v


class IloSectorResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class SectorResponse(BaseModel):
    id: int
    title: str
    description: str | None
    ilo_sector_id: int
    ilo_sector: IloSectorResponse
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
