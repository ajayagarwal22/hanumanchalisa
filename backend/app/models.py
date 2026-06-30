"""Pydantic data models shared across the API."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ContactLinks(BaseModel):
    linkedin: str | None = None
    github: str | None = None
    website: str | None = None


class CandidateProfile(BaseModel):
    """Structured candidate data, partly extracted from the resume and partly
    supplied by the user."""

    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    headline: str | None = None
    summary: str | None = None
    links: ContactLinks = Field(default_factory=ContactLinks)
    skills: list[str] = Field(default_factory=list)
    titles: list[str] = Field(default_factory=list)
    years_experience: float | None = None
    resume_filename: str | None = None
    resume_text: str | None = None
    raw_resume_excerpt: str | None = None
    updated_at: datetime = Field(default_factory=_now)


class JobSearchRequest(BaseModel):
    keywords: str = Field(..., description="Role / skills query, e.g. 'backend engineer python'")
    location: str = ""
    remote: bool = False
    limit: int = Field(20, ge=1, le=100)
    use_profile: bool = Field(
        True, description="Blend the stored profile titles/skills into the query"
    )


class JobPosting(BaseModel):
    id: str
    title: str
    company: str
    location: str | None = None
    url: str
    posted_at: str | None = None
    description: str | None = None
    source: str = "linkedin"


class ScoredJob(BaseModel):
    job: JobPosting
    score: float = Field(..., description="0-100 match score")
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list)


class CoverLetterRequest(BaseModel):
    job_id: str
    tone: str = Field("professional", description="professional | enthusiastic | concise")
    extra_notes: str = ""


class CoverLetterResponse(BaseModel):
    job_id: str
    content: str
    generated_with: str  # "llm" or "template"


class FormField(BaseModel):
    name: str
    label: str
    type: str = "text"  # text | textarea | select | checkbox | file
    value: Any = None
    options: list[str] = Field(default_factory=list)
    required: bool = False
    confidence: float = 1.0  # 0-1; low confidence flags fields needing review


class ApplicationStatus(str, Enum):
    draft = "draft"
    awaiting_approval = "awaiting_approval"
    approved = "approved"
    submitted = "submitted"
    rejected = "rejected"
    failed = "failed"


class Application(BaseModel):
    id: str
    job: JobPosting
    fields: list[FormField] = Field(default_factory=list)
    cover_letter: str | None = None
    status: ApplicationStatus = ApplicationStatus.draft
    notes: str | None = None
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)
    submission_log: list[str] = Field(default_factory=list)


class BuildApplicationRequest(BaseModel):
    job_id: str
    generate_cover_letter: bool = True
    tone: str = "professional"


class ApprovalRequest(BaseModel):
    approve: bool
    edited_fields: list[FormField] | None = None
    edited_cover_letter: str | None = None
