"""Application building, cover letters, approval & submission endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models import (
    Application,
    ApplicationStatus,
    ApprovalRequest,
    BuildApplicationRequest,
    CoverLetterRequest,
    CoverLetterResponse,
)
from ..services import application as app_service
from ..services import cover_letter as cover_service
from ..services import matcher
from ..services.store import get_store

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.post("/cover-letter", response_model=CoverLetterResponse)
def cover_letter(req: CoverLetterRequest) -> CoverLetterResponse:
    store = get_store()
    job = store.get_job(req.job_id)
    if not job:
        raise HTTPException(404, "Job not found. Run a search first.")
    profile = store.get_profile()
    scored = matcher.score_job(profile, job)
    content, source = cover_service.generate_cover_letter(
        profile, scored, tone=req.tone, extra_notes=req.extra_notes
    )
    return CoverLetterResponse(job_id=req.job_id, content=content, generated_with=source)


@router.post("/build", response_model=Application)
def build(req: BuildApplicationRequest) -> Application:
    store = get_store()
    job = store.get_job(req.job_id)
    if not job:
        raise HTTPException(404, "Job not found. Run a search first.")
    profile = store.get_profile()
    if not profile.resume_filename:
        raise HTTPException(400, "Upload a resume before building an application.")
    scored = matcher.score_job(profile, job)

    letter = None
    if req.generate_cover_letter:
        letter, _ = cover_service.generate_cover_letter(profile, scored, tone=req.tone)

    app = app_service.build_application(profile, scored, letter)
    return store.put_application(app)


@router.get("", response_model=list[Application])
def list_applications() -> list[Application]:
    return get_store().list_applications()


@router.get("/{app_id}", response_model=Application)
def get_application(app_id: str) -> Application:
    app = get_store().get_application(app_id)
    if not app:
        raise HTTPException(404, "Application not found")
    return app


@router.post("/{app_id}/approve", response_model=Application)
async def approve(app_id: str, req: ApprovalRequest) -> Application:
    store = get_store()
    app = store.get_application(app_id)
    if not app:
        raise HTTPException(404, "Application not found")
    if app.status in (ApplicationStatus.submitted,):
        raise HTTPException(409, "Application already submitted")

    # Apply any edits the candidate made during review.
    if req.edited_fields is not None:
        app.fields = req.edited_fields
    if req.edited_cover_letter is not None:
        app.cover_letter = req.edited_cover_letter
        for f in app.fields:
            if f.name == "cover_letter":
                f.value = req.edited_cover_letter

    if not req.approve:
        app.status = ApplicationStatus.rejected
        app.submission_log.append("Candidate rejected the draft. Not submitted.")
        return store.put_application(app)

    missing = app_service.missing_required(app)
    if missing:
        raise HTTPException(
            400,
            f"Cannot submit – required fields still empty: {', '.join(missing)}",
        )

    app.status = ApplicationStatus.approved
    app.submission_log.append("Candidate approved the application.")
    app = await app_service.submit_application(app)
    return store.put_application(app)
