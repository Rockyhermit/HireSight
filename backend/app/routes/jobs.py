import asyncio

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from .. import ai_engine, auth, database, models, schemas
from ..database import SessionLocal

router = APIRouter(prefix="/jobs", tags=["Jobs"])

ALLOWED_JOB_STATUSES = {"Applied", "Interviewing", "Offered", "Rejected"}


class JobStatusUpdate(BaseModel):
    status: str


class JobWithHistory(schemas.JobApplicationOut):
    history: list[schemas.AIFeedbackOut] = []

    model_config = ConfigDict(from_attributes=True)


def process_ai_analysis(job_id: int) -> None:
    db = SessionLocal()
    job = None
    try:
        job = db.query(models.JobApplication).filter(models.JobApplication.id == job_id).first()
        if job is None:
            return

        job.analysis_status = "processing"
        db.commit()

        latest_resume = (
            db.query(models.Resume)
            .filter(models.Resume.user_id == job.user_id)
            .order_by(models.Resume.uploaded_at.desc(), models.Resume.id.desc())
            .first()
        )
        if latest_resume is None:
            raise ValueError("No resume found for user.")

        resume_text = latest_resume.raw_text
        job_desc = job.job_description
        result = asyncio.run(ai_engine.run_hybrid_analysis(resume_text, job_desc))

        feedback = models.AIFeedback(
            application_id=job.id,
            resume_id=latest_resume.id,
            match_score=float(result.get("match_score", 0)),
            keyword_score=float(result.get("keyword_score", 0)),
            semantic_score=float(result.get("semantic_score", 0)),
            missing_keywords=result.get("missing_keywords", []),
            improvements=result.get("improvements", []),
            rewritten_summary=result.get("rewritten_summary", ""),
            ats_tips=result.get("ats_tips", []),
        )
        db.add(feedback)

        job.analysis_status = "completed"
        db.commit()
    except Exception as e:
        print(f"Analysis failed: {e}")
        if job is None:
            job = db.query(models.JobApplication).filter(models.JobApplication.id == job_id).first()
        if job is not None:
            job.analysis_status = "failed"
            db.commit()
    finally:
        db.close()


@router.get("/", response_model=list[schemas.JobApplicationOut])
def list_jobs(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> list[models.JobApplication]:
    return (
        db.query(models.JobApplication)
        .filter(models.JobApplication.user_id == current_user.id)
        .order_by(models.JobApplication.created_at.desc())
        .all()
    )


@router.post("/", response_model=schemas.JobApplicationOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: schemas.JobApplicationCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> models.JobApplication:
    job = models.JobApplication(
        user_id=current_user.id,
        company_name=payload.company_name,
        job_title=payload.job_title,
        job_description=payload.job_description,
        status=payload.status,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("/{job_id}", response_model=JobWithHistory)
def get_job(
    job_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> models.JobApplication:
    job = (
        db.query(models.JobApplication)
        .filter(
            models.JobApplication.id == job_id,
            models.JobApplication.user_id == current_user.id,
        )
        .first()
    )
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


@router.patch("/{job_id}", response_model=schemas.JobApplicationOut)
def update_job_status(
    job_id: int,
    payload: JobStatusUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> models.JobApplication:
    if payload.status not in ALLOWED_JOB_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {sorted(ALLOWED_JOB_STATUSES)}",
        )

    job = (
        db.query(models.JobApplication)
        .filter(
            models.JobApplication.id == job_id,
            models.JobApplication.user_id == current_user.id,
        )
        .first()
    )
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    job.status = payload.status
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> dict[str, str]:
    job = (
        db.query(models.JobApplication)
        .filter(
            models.JobApplication.id == job_id,
            models.JobApplication.user_id == current_user.id,
        )
        .first()
    )
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    db.query(models.AIFeedback).filter(
        models.AIFeedback.application_id == job_id
    ).delete(synchronize_session=False)
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}


@router.post("/{job_id}/analyze")
def analyze_job(
    job_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> dict[str, str]:
    job = (
        db.query(models.JobApplication)
        .filter(
            models.JobApplication.id == job_id,
            models.JobApplication.user_id == current_user.id,
        )
        .first()
    )
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    job.analysis_status = "pending"
    db.commit()

    background_tasks.add_task(process_ai_analysis, job.id)
    return {"detail": "AI analysis queued", "analysis_status": "pending"}
