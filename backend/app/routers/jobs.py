"""Job search + matching endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from ..models import JobSearchRequest, ScoredJob
from ..services import job_search, matcher
from ..services.store import get_store

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _build_query(req: JobSearchRequest, profile) -> str:
    query = req.keywords.strip()
    if req.use_profile:
        extras: list[str] = []
        if not query and profile.headline:
            extras.append(profile.headline)
        if not query and profile.titles:
            extras.extend(profile.titles[:2])
        query = " ".join([query, *extras]).strip()
    return query or "Software Engineer"


@router.post("/search", response_model=list[ScoredJob])
async def search(req: JobSearchRequest) -> list[ScoredJob]:
    store = get_store()
    profile = store.get_profile()
    query = _build_query(req, profile)

    jobs = await job_search.search_jobs(
        keywords=query, location=req.location, remote=req.remote, limit=req.limit
    )

    # Enrich top results with full descriptions for better matching/cover letters.
    for job in jobs[: min(len(jobs), 10)]:
        if not job.description and job.source == "linkedin":
            desc = await job_search.fetch_job_description(job.url)
            if desc:
                job.description = desc

    store.put_jobs(jobs)
    ranked = matcher.rank_jobs(profile, jobs)
    return ranked


@router.get("/{job_id}", response_model=ScoredJob)
async def get_job(job_id: str) -> ScoredJob:
    from fastapi import HTTPException

    store = get_store()
    job = store.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found. Run a search first.")
    if not job.description and job.source == "linkedin":
        desc = await job_search.fetch_job_description(job.url)
        if desc:
            job.description = desc
            store.put_jobs([job])
    return matcher.score_job(store.get_profile(), job)
