"""Answer-memory helpers.

Normalizes application questions to a stable key and provides fuzzy matching so
that slightly reworded questions ("Are you authorized to work in the US?" vs
"Are you legally authorized to work in the United States?") still resolve to the
same remembered answer.
"""

from __future__ import annotations

import re

# Fields that come from the candidate profile and should NOT be stored as
# reusable "question" answers (they are filled from the profile every time).
PROFILE_FIELD_NAMES = {
    "first_name",
    "last_name",
    "email",
    "phone",
    "location",
    "linkedin",
    "github",
    "website",
    "resume",
    "years_experience",
    "cover_letter",
}

_PUNCT_RE = re.compile(r"[^a-z0-9 ]+")
_WS_RE = re.compile(r"\s+")
_STOP = {
    "the", "a", "an", "to", "of", "in", "on", "for", "you", "your", "are",
    "is", "do", "did", "will", "would", "have", "has", "any", "please", "this",
    "we", "our", "or", "and", "be", "with", "at", "if",
}


def normalize_question(text: str) -> str:
    text = (text or "").lower().strip()
    text = _PUNCT_RE.sub(" ", text)
    text = _WS_RE.sub(" ", text).strip()
    return text


def _tokens(text: str) -> set[str]:
    return {t for t in normalize_question(text).split() if t and t not in _STOP}


def similarity(a: str, b: str) -> float:
    """Token Jaccard similarity in [0, 1]."""
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return 0.0
    inter = len(ta & tb)
    union = len(ta | tb)
    return inter / union if union else 0.0


def best_match(question: str, keys: list[str], threshold: float = 0.6) -> str | None:
    """Return the stored key best matching ``question`` (or None).

    Exact normalized equality always wins; otherwise the highest token-Jaccard
    score above ``threshold`` is returned.
    """
    norm = normalize_question(question)
    if norm in keys:
        return norm
    best_key: str | None = None
    best_score = threshold
    for key in keys:
        score = similarity(norm, key)
        if score > best_score:
            best_score = score
            best_key = key
    return best_key
