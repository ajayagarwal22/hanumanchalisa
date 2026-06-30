"""Browser auto-fill endpoints (Playwright).

Auto-fill opens the real application form (Easy Apply or external ATS) and fills
it from your profile + saved answers, then stops so you review and submit
yourself. Nothing is ever submitted automatically.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services import browser_autofill as bf
from ..services import cover_letter as cover_service
from ..services import matcher
from ..services.store import get_store

router = APIRouter(prefix="/api/automation", tags=["automation"])


class AutofillRequest(BaseModel):
    job_id: str | None = None
    url: str | None = None
    cover_letter: str | None = None  # use this exact text if provided
    tone: str = "professional"


@router.get("/status")
def status() -> dict:
    return {
        "playwright_available": bf.playwright_available(),
        "browser_open": bf.get_session().started,
    }


@router.post("/connect")
async def connect() -> dict:
    return await bf.connect_linkedin()


@router.post("/autofill")
async def autofill(req: AutofillRequest) -> dict:
    store = get_store()
    profile = store.get_profile()
    url = req.url
    cover = req.cover_letter
    if req.job_id:
        job = store.get_job(req.job_id)
        if not job:
            raise HTTPException(404, "Job not found. Run a search first.")
        url = url or job.url
        if not cover:
            scored = matcher.score_job(profile, job)
            cover, _ = cover_service.generate_cover_letter(profile, scored, tone=req.tone)
    if not url:
        raise HTTPException(400, "Provide a job_id or url to auto-fill.")
    return await bf.autofill_job(url, profile, store, cover_letter=cover)


@router.post("/close")
async def close() -> dict:
    return await bf.close_session()
