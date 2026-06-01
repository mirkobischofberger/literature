import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime

from models import Base, SearchConfig, SearchResult
from schemas import SearchConfigCreate, SearchConfigRead, SearchResultRead, RunResponse
from search import run_search
from scheduler import scheduler, schedule_config, remove_scheduled_job
from email_sender import send_results_email

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = "sqlite:///./literature.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


async def run_config_job(config_id: int):
    db = SessionLocal()
    try:
        config = db.query(SearchConfig).filter(SearchConfig.id == config_id).first()
        if not config:
            logger.warning(f"Config {config_id} not found for scheduled run")
            return

        logger.info(f"Running scheduled search for config {config_id}: {config.keywords}")
        results = await run_search(config)

        existing_dois = set(
            r.doi for r in db.query(SearchResult.doi)
            .filter(SearchResult.config_id == config_id, SearchResult.doi.isnot(None))
            .all()
        )
        existing_titles = set(
            (r.title or "").lower()[:80]
            for r in db.query(SearchResult.title)
            .filter(SearchResult.config_id == config_id)
            .all()
        )

        new_results = []
        for r in results:
            doi = r.get("doi")
            title_key = (r.get("title") or "").lower()[:80]
            if doi and doi in existing_dois:
                continue
            if not doi and title_key in existing_titles:
                continue

            sr = SearchResult(
                config_id=config_id,
                doi=doi,
                title=r.get("title", "Untitled"),
                authors=r.get("authors", []),
                journal=r.get("journal"),
                year=r.get("year"),
                abstract=r.get("abstract"),
                url=r.get("url"),
                source_db=r.get("source_db"),
            )
            db.add(sr)
            new_results.append(r)

        config.last_run_at = datetime.utcnow()
        db.commit()

        if new_results and config.notification_method == "email" and config.notification_email:
            send_results_email(
                to_email=config.notification_email,
                config_name=config.name or config.keywords,
                keywords=config.keywords,
                results=new_results,
            )

        logger.info(f"Config {config_id} completed: {len(new_results)} new results")
    except Exception as e:
        logger.error(f"Error running config {config_id}: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    scheduler.start()

    # Reschedule all active configs on startup
    db = SessionLocal()
    try:
        configs = db.query(SearchConfig).filter(SearchConfig.is_active == True).all()
        for config in configs:
            schedule_config(config.id, config.frequency, run_config_job)
    finally:
        db.close()

    yield

    scheduler.shutdown()


app = FastAPI(title="Literature Search API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/api/search-configs", response_model=List[SearchConfigRead])
def list_configs(db: Session = Depends(get_db)):
    return db.query(SearchConfig).order_by(SearchConfig.created_at.desc()).all()


@app.post("/api/search-configs", response_model=SearchConfigRead, status_code=201)
def create_config(payload: SearchConfigCreate, db: Session = Depends(get_db)):
    if not payload.keywords.strip():
        raise HTTPException(status_code=400, detail="Keywords cannot be empty")
    if payload.notification_method == "email" and not payload.notification_email:
        raise HTTPException(status_code=400, detail="Email address required for email notifications")
    if payload.frequency not in ("daily", "weekly", "monthly"):
        raise HTTPException(status_code=400, detail="Frequency must be daily, weekly, or monthly")

    config = SearchConfig(
        name=payload.name or payload.keywords[:60],
        universities=payload.universities,
        journals=payload.journals,
        databases=payload.databases if payload.databases else ["openalex"],
        keywords=payload.keywords,
        frequency=payload.frequency,
        notification_method=payload.notification_method,
        notification_email=payload.notification_email,
    )
    db.add(config)
    db.commit()
    db.refresh(config)

    job_id = schedule_config(config.id, config.frequency, run_config_job)
    config.job_id = job_id
    db.commit()
    db.refresh(config)

    return config


@app.delete("/api/search-configs/{config_id}", status_code=204)
def delete_config(config_id: int, db: Session = Depends(get_db)):
    config = db.query(SearchConfig).filter(SearchConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    remove_scheduled_job(config_id)
    db.delete(config)
    db.commit()


@app.post("/api/search-configs/{config_id}/run", response_model=RunResponse)
async def run_config(config_id: int, db: Session = Depends(get_db)):
    config = db.query(SearchConfig).filter(SearchConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    results = await run_search(config)

    existing_dois = set(
        r.doi for r in db.query(SearchResult.doi)
        .filter(SearchResult.config_id == config_id, SearchResult.doi.isnot(None))
        .all()
    )
    existing_titles = set(
        (r.title or "").lower()[:80]
        for r in db.query(SearchResult.title)
        .filter(SearchResult.config_id == config_id)
        .all()
    )

    new_count = 0
    new_results = []
    for r in results:
        doi = r.get("doi")
        title_key = (r.get("title") or "").lower()[:80]
        if doi and doi in existing_dois:
            continue
        if not doi and title_key in existing_titles:
            continue

        sr = SearchResult(
            config_id=config_id,
            doi=doi,
            title=r.get("title", "Untitled"),
            authors=r.get("authors", []),
            journal=r.get("journal"),
            year=r.get("year"),
            abstract=r.get("abstract"),
            url=r.get("url"),
            source_db=r.get("source_db"),
        )
        db.add(sr)
        new_count += 1
        new_results.append(r)

    config.last_run_at = datetime.utcnow()
    db.commit()

    if new_results and config.notification_method == "email" and config.notification_email:
        send_results_email(
            to_email=config.notification_email,
            config_name=config.name or config.keywords,
            keywords=config.keywords,
            results=new_results,
        )

    return RunResponse(message=f"Search completed successfully", new_results=new_count)


@app.get("/api/results", response_model=List[SearchResultRead])
def list_results(
    config_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    query = db.query(SearchResult).order_by(SearchResult.fetched_at.desc())
    if config_id:
        query = query.filter(SearchResult.config_id == config_id)
    return query.offset(offset).limit(limit).all()
