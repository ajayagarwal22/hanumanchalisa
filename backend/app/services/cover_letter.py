"""Tailored cover letter generation.

Uses an OpenAI-compatible LLM when ``OPENAI_API_KEY`` is configured, and falls
back to a deterministic, genuinely-tailored template otherwise so the feature
always works.
"""

from __future__ import annotations

from ..config import get_settings
from ..models import CandidateProfile, JobPosting, ScoredJob

_TONE_GUIDE = {
    "professional": "professional, confident and warm",
    "enthusiastic": "energetic and enthusiastic while staying credible",
    "concise": "concise and punchy, no filler",
}


def _build_prompt(
    profile: CandidateProfile, scored: ScoredJob, tone: str, extra_notes: str
) -> str:
    job = scored.job
    skills = ", ".join(profile.skills[:20]) or "(not specified)"
    matched = ", ".join(scored.matched_skills) or "(none detected)"
    return f"""Write a tailored cover letter for the following job application.

CANDIDATE
- Name: {profile.full_name or 'the candidate'}
- Headline: {profile.headline or 'N/A'}
- Years of experience: {profile.years_experience or 'N/A'}
- Key skills: {skills}
- LinkedIn: {profile.links.linkedin or 'N/A'}
- GitHub: {profile.links.github or 'N/A'}
- Website: {profile.links.website or 'N/A'}
- Summary: {profile.summary or 'N/A'}

JOB
- Title: {job.title}
- Company: {job.company}
- Location: {job.location or 'N/A'}
- Description: {(job.description or 'N/A')[:1800]}

MATCH CONTEXT
- Skills that overlap with the role: {matched}

ADDITIONAL NOTES FROM CANDIDATE: {extra_notes or 'none'}

REQUIREMENTS
- Tone: {_TONE_GUIDE.get(tone, _TONE_GUIDE['professional'])}.
- 3-4 short paragraphs, under 320 words.
- Reference 2-3 concrete skills from the overlap that match the role.
- Do NOT invent employers, degrees, or metrics that were not provided.
- Address it generically ("Dear Hiring Manager,") unless a name is known.
- End with the candidate's name.
Return only the cover letter text.
"""


def _llm_cover_letter(prompt: str) -> str | None:
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url or None,
        )
        resp = client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert career coach who writes "
                    "specific, non-generic cover letters.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=600,
        )
        return (resp.choices[0].message.content or "").strip() or None
    except Exception:
        return None


def _template_cover_letter(
    profile: CandidateProfile, scored: ScoredJob, tone: str, extra_notes: str
) -> str:
    job = scored.job
    name = profile.full_name or "Your Name"
    headline = profile.headline or "an experienced professional"
    matched = scored.matched_skills or profile.skills[:4]
    skills_phrase = (
        ", ".join(matched[:-1]) + (f" and {matched[-1]}" if len(matched) > 1 else "")
        if matched
        else "the core technologies your team relies on"
    )
    exp = (
        f"With {int(profile.years_experience)}+ years of experience, "
        if profile.years_experience
        else ""
    )
    opener = {
        "enthusiastic": f"I was genuinely excited to come across the {job.title} role at {job.company}.",
        "concise": f"I'm applying for the {job.title} role at {job.company}.",
    }.get(
        tone,
        f"I am writing to express my strong interest in the {job.title} position at {job.company}.",
    )

    links = []
    if profile.links.linkedin:
        links.append(f"LinkedIn: {profile.links.linkedin}")
    if profile.links.github:
        links.append(f"GitHub: {profile.links.github}")
    if profile.links.website:
        links.append(f"Portfolio: {profile.links.website}")
    links_line = "  •  ".join(links)

    notes_para = (
        f"\n\nA note on fit: {extra_notes.strip()}" if extra_notes.strip() else ""
    )

    body = f"""Dear Hiring Manager,

{opener} As {headline}, I bring hands-on expertise in {skills_phrase}, which maps directly to what this role requires.

{exp}I have repeatedly delivered production-quality work using the same tools highlighted in your posting. I focus on writing maintainable code, collaborating closely with cross-functional teams, and shipping features that move real metrics. The combination of {skills_phrase} that {job.company} is looking for is exactly where I do my best work.{notes_para}

I would welcome the chance to discuss how my background can contribute to your team's goals. You can review my work and experience here:
{links_line if links_line else '(links available on request)'}

Thank you for your time and consideration.

Sincerely,
{name}"""
    return body.strip()


def generate_cover_letter(
    profile: CandidateProfile, scored: ScoredJob, tone: str = "professional", extra_notes: str = ""
) -> tuple[str, str]:
    """Return (content, generated_with)."""
    prompt = _build_prompt(profile, scored, tone, extra_notes)
    content = _llm_cover_letter(prompt)
    if content:
        return content, "llm"
    return _template_cover_letter(profile, scored, tone, extra_notes), "template"
