import enum
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Text, desc
from sqlalchemy.orm import relationship
from sqlalchemy.sql.schema import Column

from .database import Base


class AnalysisStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    applications = relationship("JobApplication", back_populates="owner")
    resumes = relationship("Resume", back_populates="owner")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name = Column(String, nullable=False)
    raw_text = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True)
    version = Column(Integer, default=1, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="resumes")


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_name = Column(String, index=True, nullable=False)
    job_title = Column(String, nullable=False)
    job_description = Column(Text, nullable=False)
    status = Column(String, default="Applied", nullable=False)
    analysis_status = Column(
        SAEnum(AnalysisStatus, name="analysis_status"),
        default=AnalysisStatus.pending,
        nullable=False,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="applications")
    history = relationship(
        "AIFeedback",
        back_populates="application",
        order_by=lambda: desc(AIFeedback.created_at),
    )


class AIFeedback(Base):
    __tablename__ = "ai_feedback"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    match_score = Column(Float, nullable=False)
    keyword_score = Column(Float, nullable=False)
    semantic_score = Column(Float, nullable=False)
    missing_keywords = Column(JSON, nullable=True)
    improvements = Column(JSON, nullable=True)
    rewritten_summary = Column(Text, nullable=True)
    ats_tips = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    application = relationship("JobApplication", back_populates="history")
