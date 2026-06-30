"""Saved-answer memory endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models import AnswerRecord, ForgetAnswerRequest, UpsertAnswerRequest
from ..services.store import get_store

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("", response_model=list[AnswerRecord])
def list_answers() -> list[AnswerRecord]:
    return get_store().list_answers()


@router.post("", response_model=AnswerRecord)
def upsert_answer(req: UpsertAnswerRequest) -> AnswerRecord:
    if not req.question.strip():
        raise HTTPException(400, "Question text is required.")
    return get_store().remember_answer(
        question=req.question, value=req.value, type_=req.type, options=req.options
    )


@router.delete("")
def forget_answer(req: ForgetAnswerRequest) -> dict:
    removed = get_store().forget_answer(req.key)
    if not removed:
        raise HTTPException(404, "No saved answer matched that key.")
    return {"removed": True}
