from datetime import datetime

from pydantic import BaseModel, field_validator


class IscedLevelResponse(BaseModel):
    id: int
    level: int
    name: str

    model_config = {"from_attributes": True}


class EducationLevelCreate(BaseModel):
    name: str
    description: str | None = None
    isced_level_id: int

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name is required")
        if len(v) > 255:
            raise ValueError("Name must be 255 characters or less")
        return v


class EducationLevelUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    isced_level_id: int | None = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name must not be empty")
            if len(v) > 255:
                raise ValueError("Name must be 255 characters or less")
        return v


class EducationLevelResponse(BaseModel):
    id: int
    name: str
    description: str | None
    isced_level_id: int
    isced_level: IscedLevelResponse
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
