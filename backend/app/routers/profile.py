"""Profile + resume endpoints."""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..config import UPLOAD_DIR
from ..models import CandidateProfile, ContactLinks
from ..services import resume_parser
from ..services.store import get_store

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=CandidateProfile)
def get_profile() -> CandidateProfile:
    return get_store().get_profile()


@router.post("/resume", response_model=CandidateProfile)
async def upload_resume(file: UploadFile = File(...)) -> CandidateProfile:
    if not file.filename:
        raise HTTPException(400, "No file provided")
    data = await file.read()
    if not data:
        raise HTTPException(400, "Uploaded file is empty")
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(400, "Resume too large (max 10 MB)")
    try:
        profile = resume_parser.parse_resume(file.filename, data)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(422, f"Could not parse resume: {exc}") from exc

    # Persist the raw file so it can be attached during submission.
    (UPLOAD_DIR / file.filename).write_bytes(data)

    store = get_store()
    existing = store.get_profile()
    # Preserve any user-entered links/fields the resume parser didn't find.
    merged_links = ContactLinks(
        linkedin=profile.links.linkedin or existing.links.linkedin,
        github=profile.links.github or existing.links.github,
        website=profile.links.website or existing.links.website,
    )
    profile.links = merged_links
    return store.set_profile(profile)


@router.put("", response_model=CandidateProfile)
def update_profile(profile: CandidateProfile) -> CandidateProfile:
    store = get_store()
    existing = store.get_profile()
    # Keep the parsed resume text unless explicitly replaced.
    if not profile.resume_text and existing.resume_text:
        profile.resume_text = existing.resume_text
    if not profile.resume_filename and existing.resume_filename:
        profile.resume_filename = existing.resume_filename
    return store.set_profile(profile)
