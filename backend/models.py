from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class SearchConfig(Base):
    __tablename__ = "search_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, default="")
    universities = Column(JSON, default=list)
    journals = Column(JSON, default=list)
    databases = Column(JSON, default=list)
    keywords = Column(Text, nullable=False)
    frequency = Column(String(50), nullable=False)  # daily, weekly, monthly
    notification_method = Column(String(50), nullable=False)  # email, dashboard
    notification_email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_run_at = Column(DateTime, nullable=True)
    job_id = Column(String(255), nullable=True)

    results = relationship("SearchResult", back_populates="config", cascade="all, delete-orphan")


class SearchResult(Base):
    __tablename__ = "search_results"

    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("search_configs.id"), nullable=False)
    doi = Column(String(512), nullable=True, index=True)
    title = Column(Text, nullable=False)
    authors = Column(JSON, default=list)
    journal = Column(String(512), nullable=True)
    year = Column(Integer, nullable=True)
    abstract = Column(Text, nullable=True)
    url = Column(Text, nullable=True)
    source_db = Column(String(100), nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow)

    config = relationship("SearchConfig", back_populates="results")
