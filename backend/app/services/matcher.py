"""Job<->candidate match scoring.

Combines two signals into a 0-100 score:

1. Skill overlap – how many of the profile's skills (and the role's required
   skills, drawn from the SKILL_VOCAB) appear in the job description.
2. Text similarity – TF-IDF cosine similarity between the candidate's resume
   text and the job title + description.

A pure-Python TF-IDF is implemented to avoid heavy ML dependencies, so the
matcher works fully offline with zero external services.
"""

from __future__ import annotations

import math
import re
from collections import Counter

from ..models import CandidateProfile, JobPosting, ScoredJob
from .resume_parser import SKILL_VOCAB

_TOKEN_RE = re.compile(r"[a-z0-9+#.]+")
_STOPWORDS = {
    "the", "and", "for", "with", "you", "our", "are", "will", "have", "this",
    "that", "from", "your", "their", "they", "who", "all", "can", "but", "not",
    "job", "work", "team", "role", "company", "experience", "years", "ability",
    "including", "etc", "via", "per", "use", "using", "new", "well", "more",
    "a", "an", "of", "to", "in", "on", "as", "is", "be", "or", "at", "by", "we",
}


def _tokens(text: str) -> list[str]:
    return [t for t in _TOKEN_RE.findall(text.lower()) if t not in _STOPWORDS and len(t) > 1]


def _tf(tokens: list[str]) -> dict[str, float]:
    counts = Counter(tokens)
    total = sum(counts.values()) or 1
    return {t: c / total for t, c in counts.items()}


def _cosine_tfidf(doc_a: str, doc_b: str) -> float:
    toks_a, toks_b = _tokens(doc_a), _tokens(doc_b)
    if not toks_a or not toks_b:
        return 0.0
    tf_a, tf_b = _tf(toks_a), _tf(toks_b)
    vocab = set(tf_a) | set(tf_b)
    # idf over the two-document corpus (down-weights words common to both)
    idf: dict[str, float] = {}
    for term in vocab:
        df = (term in tf_a) + (term in tf_b)
        idf[term] = math.log((2 + 1) / (df + 1)) + 1
    va = {t: tf_a.get(t, 0.0) * idf[t] for t in vocab}
    vb = {t: tf_b.get(t, 0.0) * idf[t] for t in vocab}
    dot = sum(va[t] * vb[t] for t in vocab)
    na = math.sqrt(sum(v * v for v in va.values()))
    nb = math.sqrt(sum(v * v for v in vb.values()))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _skills_in_text(text: str) -> set[str]:
    lower = text.lower()
    found = set()
    for skill in SKILL_VOCAB:
        pattern = r"(?<![A-Za-z0-9])" + re.escape(skill.lower()) + r"(?![A-Za-z0-9])"
        if re.search(pattern, lower):
            found.add(skill)
    return found


def score_job(profile: CandidateProfile, job: JobPosting) -> ScoredJob:
    job_text = " ".join(filter(None, [job.title, job.description or ""]))
    job_skills = _skills_in_text(job_text)
    profile_skills = {s.lower() for s in profile.skills}
    profile_skills_norm = {s for s in SKILL_VOCAB if s.lower() in profile_skills}

    matched = sorted(job_skills & profile_skills_norm)
    missing = sorted(job_skills - profile_skills_norm)

    if job_skills:
        skill_ratio = len(matched) / len(job_skills)
    else:
        skill_ratio = 0.0

    resume_text = profile.resume_text or " ".join(
        profile.skills + profile.titles + ([profile.summary] if profile.summary else [])
    )
    text_sim = _cosine_tfidf(resume_text, job_text)

    # Title affinity: does the candidate have a matching/adjacent title?
    title_affinity = 0.0
    jt = job.title.lower()
    for t in profile.titles + ([profile.headline] if profile.headline else []):
        tl = t.lower()
        common = set(_tokens(tl)) & set(_tokens(jt))
        if common:
            title_affinity = max(title_affinity, len(common) / max(len(set(_tokens(jt))), 1))

    # Weighted blend
    raw = 0.5 * skill_ratio + 0.3 * text_sim + 0.2 * title_affinity
    score = round(min(100.0, raw * 100), 1)

    reasons: list[str] = []
    if matched:
        reasons.append(f"Matches {len(matched)} required skill(s): {', '.join(matched[:6])}")
    if title_affinity > 0:
        reasons.append("Title aligns with your experience")
    if text_sim > 0.15:
        reasons.append("Strong overall resume↔description similarity")
    if missing:
        reasons.append(f"Gaps to address: {', '.join(missing[:5])}")
    if not reasons:
        reasons.append("Limited overlap detected — review carefully")

    return ScoredJob(
        job=job,
        score=score,
        matched_skills=matched,
        missing_skills=missing,
        reasons=reasons,
    )


def rank_jobs(profile: CandidateProfile, jobs: list[JobPosting]) -> list[ScoredJob]:
    scored = [score_job(profile, j) for j in jobs]
    scored.sort(key=lambda s: s.score, reverse=True)
    return scored
