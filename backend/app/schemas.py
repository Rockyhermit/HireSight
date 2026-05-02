from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str

    model_config = ConfigDict(from_attributes=True)


class JobApplicationCreate(BaseModel):
    company_name: str
    job_title: str
    job_description: str = ""
    status: str = "Applied"


class JobApplicationOut(JobApplicationCreate):
    id: int
    analysis_status: str = "pending"

    model_config = ConfigDict(from_attributes=True)


class AIFeedbackOut(BaseModel):
    id: int
    application_id: int
    resume_id: int
    match_score: float
    keyword_score: float
    semantic_score: float
    missing_keywords: Any | None = None
    improvements: Any | None = None
    rewritten_summary: str | None = None
    ats_tips: Any | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str
