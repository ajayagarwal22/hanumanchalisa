"""Application form assembly and the approval/submission gate.

Two principles drive this module:

1. **Nothing is ever submitted without explicit human approval.** The build step
   produces a fully-populated, reviewable application. Submission only happens
   after an approval call from the UI.
2. **Respect platform terms.** Fully-automated browser submission to LinkedIn is
   off by default (``ENABLE_BROWSER_SUBMIT=false``) because automating actions on
   a logged-in account can violate LinkedIn's User Agreement. When disabled, the
   "submit" step records the approved package and hands the candidate a deep link
   plus a copy-paste-ready bundle to finish in their own authenticated session.
"""

from __future__ import annotations

import uuid

from ..config import get_settings
from ..models import (
    Application,
    ApplicationStatus,
    CandidateProfile,
    FormField,
    JobPosting,
    ScoredJob,
)


def build_form_fields(profile: CandidateProfile, job: JobPosting) -> list[FormField]:
    """Construct the set of fields a typical LinkedIn Easy Apply / job form asks
    for, pre-filled from the candidate profile. Low confidence on a field signals
    the UI to highlight it for review."""
    full_name = profile.full_name or ""
    first, _, last = (full_name.partition(" ") if full_name else ("", "", ""))

    fields: list[FormField] = [
        FormField(name="first_name", label="First name", value=first,
                  required=True, confidence=1.0 if first else 0.3),
        FormField(name="last_name", label="Last name", value=last,
                  required=True, confidence=1.0 if last else 0.3),
        FormField(name="email", label="Email", type="text", value=profile.email,
                  required=True, confidence=1.0 if profile.email else 0.2),
        FormField(name="phone", label="Phone", type="text", value=profile.phone,
                  required=True, confidence=1.0 if profile.phone else 0.2),
        FormField(name="location", label="Location / City", value=profile.location,
                  required=False, confidence=0.9 if profile.location else 0.4),
        FormField(name="linkedin", label="LinkedIn URL", value=profile.links.linkedin,
                  required=False, confidence=1.0 if profile.links.linkedin else 0.3),
        FormField(name="github", label="GitHub URL", value=profile.links.github,
                  required=False, confidence=1.0 if profile.links.github else 0.3),
        FormField(name="website", label="Website / Portfolio", value=profile.links.website,
                  required=False, confidence=1.0 if profile.links.website else 0.3),
        FormField(name="resume", label="Resume file", type="file",
                  value=profile.resume_filename, required=True,
                  confidence=1.0 if profile.resume_filename else 0.0),
        FormField(
            name="years_experience",
            label="Years of relevant experience",
            value=str(int(profile.years_experience)) if profile.years_experience else "",
            required=False,
            confidence=0.9 if profile.years_experience else 0.3,
        ),
        FormField(name="work_authorization",
                  label="Are you authorized to work in this location?",
                  type="select", options=["Yes", "No"], value=None,
                  required=True, confidence=0.0),
        FormField(name="requires_sponsorship",
                  label="Will you now or in the future require sponsorship?",
                  type="select", options=["Yes", "No"], value=None,
                  required=True, confidence=0.0),
        FormField(name="cover_letter", label="Cover letter", type="textarea",
                  value=None, required=False, confidence=0.5),
    ]
    return fields


def build_application(
    profile: CandidateProfile, scored: ScoredJob, cover_letter: str | None
) -> Application:
    job = scored.job
    fields = build_form_fields(profile, job)
    if cover_letter:
        for f in fields:
            if f.name == "cover_letter":
                f.value = cover_letter
                f.confidence = 0.9

    notes = (
        f"Match score {scored.score}/100. "
        f"Matched skills: {', '.join(scored.matched_skills) or 'none'}. "
        f"Review fields highlighted as low-confidence before approving."
    )

    app = Application(
        id=f"app-{uuid.uuid4().hex[:10]}",
        job=job,
        fields=fields,
        cover_letter=cover_letter,
        status=ApplicationStatus.awaiting_approval,
        notes=notes,
    )
    app.submission_log.append("Application drafted and awaiting your approval.")
    return app


def missing_required(app: Application) -> list[str]:
    return [f.label for f in app.fields if f.required and not (f.value and str(f.value).strip())]


async def submit_application(app: Application) -> Application:
    """Finalize an approved application.

    Honors ``ENABLE_BROWSER_SUBMIT``. When disabled (default) it records the
    approved package and produces the apply deep link for the candidate to
    complete in their own authenticated browser session.
    """
    settings = get_settings()

    if settings.enable_browser_submit:
        try:
            result = await _browser_submit(app)
            app.status = ApplicationStatus.submitted
            app.submission_log.append(result)
        except Exception as exc:  # pragma: no cover - depends on optional dep
            app.status = ApplicationStatus.failed
            app.submission_log.append(f"Automated submission failed: {exc}")
        return app

    app.status = ApplicationStatus.submitted
    app.submission_log.append(
        "Approved. Automated submission is disabled (ENABLE_BROWSER_SUBMIT=false) "
        "to respect LinkedIn's User Agreement. Open the job and paste the "
        "reviewed answers/cover letter to finish in your logged-in session."
    )
    app.submission_log.append(f"Apply link: {app.job.url}")
    return app


async def _browser_submit(app: Application) -> str:  # pragma: no cover
    """Optional Playwright-driven Easy Apply.

    Requires ``pip install playwright && playwright install chromium`` and a
    valid logged-in session (via stored cookies / manual login on first run).
    Only runs when the operator explicitly opts in. This is provided as an
    extension point; review LinkedIn's terms before enabling.
    """
    raise NotImplementedError(
        "Browser submission is an opt-in extension. Install Playwright, supply an "
        "authenticated session, and implement the Easy Apply driver here."
    )
