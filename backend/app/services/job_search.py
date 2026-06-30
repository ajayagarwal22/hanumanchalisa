"""LinkedIn public job discovery.

Uses LinkedIn's unauthenticated "jobs-guest" search endpoint which returns
public job-card HTML. This is used for *discovery only* (reading public
listings). No login or scraping of private data is performed.

If the request is blocked (common from datacenter IPs) the search degrades to a
small set of representative sample postings so the rest of the pipeline – match
scoring, cover letter, form building, approval – remains fully testable.
"""

from __future__ import annotations

import hashlib
import re

import httpx
from bs4 import BeautifulSoup

from ..config import get_settings
from ..models import JobPosting


def _job_id(url: str, title: str, company: str) -> str:
    m = re.search(r"-(\d{6,})\b", url)
    if m:
        return f"li-{m.group(1)}"
    digest = hashlib.sha1(f"{url}|{title}|{company}".encode()).hexdigest()[:12]
    return f"job-{digest}"


def _clean(text: str | None) -> str | None:
    if not text:
        return None
    return re.sub(r"\s+", " ", text).strip() or None


def _parse_cards(html: str) -> list[JobPosting]:
    soup = BeautifulSoup(html, "html.parser")
    jobs: list[JobPosting] = []
    for card in soup.select("li"):
        title_el = card.select_one("h3")
        company_el = card.select_one("h4")
        link_el = card.select_one("a[href]")
        loc_el = card.select_one(".job-search-card__location, .job-result-card__location")
        time_el = card.select_one("time")
        if not (title_el and link_el):
            continue
        url = link_el["href"].split("?")[0]
        title = _clean(title_el.get_text()) or "Unknown role"
        company = _clean(company_el.get_text()) if company_el else "Unknown company"
        jobs.append(
            JobPosting(
                id=_job_id(url, title, company or ""),
                title=title,
                company=company or "Unknown company",
                location=_clean(loc_el.get_text()) if loc_el else None,
                url=url,
                posted_at=_clean(time_el.get("datetime")) if time_el else None,
                source="linkedin",
            )
        )
    return jobs


async def search_jobs(
    keywords: str, location: str = "", remote: bool = False, limit: int = 20
) -> list[JobPosting]:
    settings = get_settings()
    params = {
        "keywords": keywords,
        "location": location,
        "start": 0,
    }
    if remote:
        params["f_WT"] = "2"  # LinkedIn's "remote" work-type filter
    headers = {
        "User-Agent": settings.user_agent,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    }
    collected: list[JobPosting] = []
    seen: set[str] = set()
    seen_keys: set[str] = set()
    try:
        async with httpx.AsyncClient(
            timeout=settings.request_timeout_seconds, headers=headers
        ) as client:
            start = 0
            while len(collected) < limit and start < 100:
                params["start"] = start
                resp = await client.get(settings.linkedin_guest_api, params=params)
                if resp.status_code != 200 or not resp.text.strip():
                    break
                page_jobs = _parse_cards(resp.text)
                if not page_jobs:
                    break
                for j in page_jobs:
                    key = f"{j.title.lower().strip()}|{j.company.lower().strip()}"
                    if j.id not in seen and key not in seen_keys:
                        seen.add(j.id)
                        seen_keys.add(key)
                        collected.append(j)
                start += 25
    except (httpx.HTTPError, ValueError):
        collected = []

    if not collected:
        collected = _sample_jobs(keywords, location, remote)

    return collected[:limit]


async def fetch_job_description(url: str) -> str | None:
    """Fetch the public job page and extract the description text."""
    settings = get_settings()
    headers = {"User-Agent": settings.user_agent, "Accept-Language": "en-US,en;q=0.9"}
    try:
        async with httpx.AsyncClient(
            timeout=settings.request_timeout_seconds, headers=headers, follow_redirects=True
        ) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            soup = BeautifulSoup(resp.text, "html.parser")
            desc = soup.select_one(
                ".show-more-less-html__markup, .description__text, "
                ".jobs-description__content"
            )
            if desc:
                return _clean(desc.get_text(separator=" "))
    except httpx.HTTPError:
        return None
    return None


def _sample_jobs(keywords: str, location: str, remote: bool) -> list[JobPosting]:
    """Representative fallback postings used when live search is unavailable."""
    kw = keywords or "Software Engineer"
    base_loc = location or ("Remote" if remote else "San Francisco, CA")
    seeds = [
        (
            "Senior Backend Engineer",
            "Northwind Labs",
            "Build and scale Python/FastAPI microservices on AWS and Kubernetes. "
            "5+ years experience with PostgreSQL, Docker and CI/CD required. "
            "Experience with Kafka and event-driven architecture is a plus.",
        ),
        (
            "Full Stack Developer",
            "BrightWave",
            "React + TypeScript front end with a Node.js/Express API. Familiarity "
            "with GraphQL, PostgreSQL and Docker. 3+ years of professional "
            "experience building web applications.",
        ),
        (
            "Machine Learning Engineer",
            "Cortex AI",
            "Design and ship ML systems using PyTorch and scikit-learn. Strong "
            "Python, pandas and NLP background. Experience deploying models with "
            "Docker and AWS preferred. LLM / RAG experience a bonus.",
        ),
        (
            "Platform / DevOps Engineer",
            "Helios Systems",
            "Own infrastructure as code with Terraform on AWS. Kubernetes, Docker, "
            "GitHub Actions, Prometheus and Grafana. Strong Linux and bash skills.",
        ),
        (
            "Data Engineer",
            "Quantum Metrics",
            "Build data pipelines with Airflow, dbt and Spark. SQL, Python and "
            "Snowflake/BigQuery experience required. Kafka streaming a plus.",
        ),
        (
            "Frontend Engineer",
            "Pixel Forge",
            "Craft delightful UIs with React, Next.js, TypeScript and Tailwind. "
            "Care about accessibility, performance and clean component design.",
        ),
    ]
    jobs: list[JobPosting] = []
    for i, (title, company, desc) in enumerate(seeds):
        url = f"https://www.linkedin.com/jobs/view/sample-{1000 + i}"
        jobs.append(
            JobPosting(
                id=f"sample-{1000 + i}",
                title=title,
                company=company,
                location=base_loc,
                url=url,
                posted_at=None,
                description=desc,
                source="sample",
            )
        )
    # Bias ordering toward the search keywords
    kw_lower = kw.lower()
    jobs.sort(key=lambda j: 0 if any(w in j.title.lower() for w in kw_lower.split()) else 1)
    return jobs
