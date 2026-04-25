from datetime import datetime

from pydantic import BaseModel, field_validator


class OccupationCreate(BaseModel):
    level: int
    code: str
    title: str
    definition: str | None = None
    group_id: int

    @field_validator("code")
    @classmethod
    def code_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Code is required")
        if len(v) > 4:
            raise ValueError("Code must be 4 characters or less")
        return v

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title is required")
        if len(v) > 500:
            raise ValueError("Title must be 500 characters or less")
        return v

    @field_validator("level")
    @classmethod
    def level_must_be_valid(cls, v: int) -> int:
        if v < 1 or v > 4:
            raise ValueError("Level must be between 1 and 4")
        return v


class OccupationUpdate(BaseModel):
    level: int | None = None
    code: str | None = None
    title: str | None = None
    definition: str | None = None
    group_id: int | None = None

    @field_validator("code")
    @classmethod
    def code_must_be_valid(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Code must not be empty")
            if len(v) > 4:
                raise ValueError("Code must be 4 characters or less")
        return v

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Title must not be empty")
            if len(v) > 500:
                raise ValueError("Title must be 500 characters or less")
        return v

    @field_validator("level")
    @classmethod
    def level_must_be_valid(cls, v: int | None) -> int | None:
        if v is not None and (v < 1 or v > 4):
            raise ValueError("Level must be between 1 and 4")
        return v


class OccupationGroupResponse(BaseModel):
    id: int
    code: int
    name: str
    skill_level: str

    model_config = {"from_attributes": True}


class OccupationResponse(BaseModel):
    id: int
    level: int
    code: str
    title: str
    definition: str | None
    group_id: int
    group: OccupationGroupResponse
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
