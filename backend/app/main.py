import io
import logging
import os
import time
from datetime import datetime

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, ConfigDict
from pypdf import PdfReader
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.extension import _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

load_dotenv()

from app import models, schemas
from app.auth import create_access_token, get_current_user, get_password_hash, verify_password
from app.database import engine, get_db
from app.routes.jobs import router as jobs_router

models.Base.metadata.create_all(bind=engine)

logger = logging.getLogger("hiresphere.api")

app = FastAPI(title="HireSphere API")
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


class ResumeOut(BaseModel):
    id: int
    file_name: str
    version: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response: Response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.6f}"
    logger.info("X-Process-Time=%s path=%s", response.headers["X-Process-Time"], request.url.path)
    return response


@app.on_event("startup")
def startup_event() -> None:
    required_vars = ["XAI_API_KEY", "DATABASE_URL", "SECRET_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        missing_list = ", ".join(missing_vars)
        raise RuntimeError(f"Missing required environment variable(s): {missing_list}")
    models.Base.metadata.create_all(bind=engine)


@app.post("/auth/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register_user(
    request: Request,
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
) -> models.User:
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = models.User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=schemas.Token)
@limiter.limit("20/minute")
def login_user(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> schemas.Token:
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    return schemas.Token(access_token=access_token, token_type="bearer")


@app.post("/resumes/upload", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> dict[str, int | str]:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are supported")

    try:
        file_bytes = await file.read()
        reader = PdfReader(io.BytesIO(file_bytes))
        extracted_text = "\n".join((page.extract_text() or "") for page in reader.pages).strip()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to parse PDF file") from exc
    finally:
        await file.close()

    resume = models.Resume(
        user_id=current_user.id,
        file_name=file.filename,
        raw_text=extracted_text,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return {"id": resume.id, "filename": resume.file_name}


@app.get("/resumes", response_model=list[ResumeOut])
@limiter.limit("60/minute")
def list_resumes(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> list[models.Resume]:
    return (
        db.query(models.Resume)
        .filter(models.Resume.user_id == current_user.id)
        .order_by(models.Resume.uploaded_at.desc(), models.Resume.id.desc())
        .all()
    )


app.include_router(jobs_router)
