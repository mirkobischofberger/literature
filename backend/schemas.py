from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime


class SearchConfigCreate(BaseModel):
    name: str = ""
    universities: List[str] = []
    journals: List[str] = []
    databases: List[str] = []
    keywords: str
    frequency: str
    notification_method: str
    notification_email: Optional[str] = None


class SearchConfigRead(BaseModel):
    id: int
    name: str
    universities: List[str]
    journals: List[str]
    databases: List[str]
    keywords: str
    frequency: str
    notification_method: str
    notification_email: Optional[str]
    is_active: bool
    created_at: datetime
    last_run_at: Optional[datetime]

    class Config:
        from_attributes = True


class SearchResultRead(BaseModel):
    id: int
    config_id: int
    doi: Optional[str]
    title: str
    authors: List[Any]
    journal: Optional[str]
    year: Optional[int]
    abstract: Optional[str]
    url: Optional[str]
    source_db: Optional[str]
    fetched_at: datetime

    class Config:
        from_attributes = True


class RunResponse(BaseModel):
    message: str
    new_results: int
