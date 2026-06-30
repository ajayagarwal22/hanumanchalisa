"""Tiny in-process state store.

Keeps the candidate profile, the latest job search results and the in-flight
applications. Persisted to a JSON file so a restart of the dev server does not
lose your profile. This is intentionally simple – swap for a real database for
multi-user deployments.
"""

from __future__ import annotations

import json
import threading
from pathlib import Path

from ..config import DATA_DIR
from ..models import AnswerRecord, Application, CandidateProfile, JobPosting
from . import memory

_STATE_FILE = DATA_DIR / "state.json"


class Store:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self.profile: CandidateProfile = CandidateProfile()
        self.jobs: dict[str, JobPosting] = {}
        self.applications: dict[str, Application] = {}
        self.answers: dict[str, AnswerRecord] = {}
        self._load()

    # ---- persistence -------------------------------------------------
    def _load(self) -> None:
        if not _STATE_FILE.exists():
            return
        try:
            data = json.loads(_STATE_FILE.read_text("utf-8"))
        except (json.JSONDecodeError, OSError):
            return
        if data.get("profile"):
            self.profile = CandidateProfile.model_validate(data["profile"])
        for jid, j in data.get("jobs", {}).items():
            self.jobs[jid] = JobPosting.model_validate(j)
        for aid, a in data.get("applications", {}).items():
            self.applications[aid] = Application.model_validate(a)
        for k, rec in data.get("answers", {}).items():
            self.answers[k] = AnswerRecord.model_validate(rec)

    def _save(self) -> None:
        payload = {
            "profile": self.profile.model_dump(mode="json"),
            "jobs": {k: v.model_dump(mode="json") for k, v in self.jobs.items()},
            "applications": {
                k: v.model_dump(mode="json") for k, v in self.applications.items()
            },
            "answers": {k: v.model_dump(mode="json") for k, v in self.answers.items()},
        }
        tmp = _STATE_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(payload, indent=2, default=str), "utf-8")
        tmp.replace(_STATE_FILE)

    # ---- profile -----------------------------------------------------
    def set_profile(self, profile: CandidateProfile) -> CandidateProfile:
        with self._lock:
            self.profile = profile
            self._save()
            return self.profile

    def get_profile(self) -> CandidateProfile:
        return self.profile

    # ---- jobs --------------------------------------------------------
    def put_jobs(self, jobs: list[JobPosting]) -> None:
        with self._lock:
            for j in jobs:
                self.jobs[j.id] = j
            self._save()

    def get_job(self, job_id: str) -> JobPosting | None:
        return self.jobs.get(job_id)

    # ---- applications ------------------------------------------------
    def put_application(self, app: Application) -> Application:
        with self._lock:
            self.applications[app.id] = app
            self._save()
            return app

    def get_application(self, app_id: str) -> Application | None:
        return self.applications.get(app_id)

    def list_applications(self) -> list[Application]:
        return sorted(
            self.applications.values(), key=lambda a: a.created_at, reverse=True
        )

    # ---- answer memory ----------------------------------------------
    def lookup_answer(self, question: str) -> AnswerRecord | None:
        key = memory.best_match(question, list(self.answers.keys()))
        return self.answers.get(key) if key else None

    def remember_answer(
        self, question: str, value, type_: str = "text", options: list[str] | None = None
    ) -> AnswerRecord:
        with self._lock:
            from datetime import datetime, timezone

            norm = memory.normalize_question(question)
            existing = self.answers.get(norm) or (
                self.answers.get(memory.best_match(question, list(self.answers.keys())) or "")
            )
            if existing:
                existing.value = value
                existing.question = question
                existing.type = type_
                if options:
                    existing.options = options
                existing.uses += 1
                existing.updated_at = datetime.now(timezone.utc)
                rec = existing
            else:
                rec = AnswerRecord(
                    key=norm,
                    question=question,
                    type=type_,
                    options=options or [],
                    value=value,
                )
                self.answers[norm] = rec
            self._save()
            return rec

    def list_answers(self) -> list[AnswerRecord]:
        return sorted(self.answers.values(), key=lambda r: r.updated_at, reverse=True)

    def forget_answer(self, key: str) -> bool:
        with self._lock:
            # accept either the stored key or a raw question
            norm = key if key in self.answers else memory.normalize_question(key)
            removed = self.answers.pop(norm, None) is not None
            if removed:
                self._save()
            return removed


_store: Store | None = None


def get_store() -> Store:
    global _store
    if _store is None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        _store = Store()
    return _store


def state_file() -> Path:
    return _STATE_FILE
