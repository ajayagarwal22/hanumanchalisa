# AutoApply

A resume-driven job-application assistant for **LinkedIn jobs**. Upload your
resume (PDF / DOCX), add your LinkedIn, GitHub and website links, and AutoApply
will:

1. **Parse your resume** into a structured profile (name, contact, skills,
   titles, years of experience, links).
2. **Discover matching jobs** from public LinkedIn listings.
3. **Score & rank** each job against your resume (skill overlap + text
   similarity + title affinity).
4. **Draft a tailored cover letter** for any job (LLM-powered when an API key is
   set, otherwise a genuinely-tailored template).
5. **Complete the full application form**, pre-filled from your profile, with
   low-confidence fields flagged for review.
6. **Ask for your approval before anything is submitted** — you review every
   field and the cover letter, edit as needed, then explicitly approve.

> **Human-in-the-loop by design.** Nothing is ever submitted automatically.
> See [Responsible use](#responsible-use--linkedin-terms).

---

## Architecture

```
frontend/   React + Vite + TypeScript single-page app (4-step wizard)
backend/    FastAPI service
  app/services/resume_parser.py   PDF/DOCX/TXT -> structured profile
  app/services/job_search.py      LinkedIn public "guest" job discovery
  app/services/matcher.py         pure-Python TF-IDF + skill match scoring
  app/services/cover_letter.py    LLM or template cover-letter generation
  app/services/application.py     form assembly + approval/submission gate
  app/routers/                    REST API
```

The backend works **fully offline** with zero credentials. Optional features:

| Feature                | Requires                          | Fallback                       |
| ---------------------- | --------------------------------- | ------------------------------ |
| Live LinkedIn search   | outbound network                  | representative sample postings |
| LLM cover letters      | `OPENAI_API_KEY`                  | tailored template generator    |
| Automated submission   | `ENABLE_BROWSER_SUBMIT` + Playwright | approval-gated manual finish |

---

## Quick start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt          # add --break-system-packages on Debian/Ubuntu
cp .env.example .env                      # optional: add OPENAI_API_KEY
python -m uvicorn app.main:app --reload --port 8000
```

API docs: <http://127.0.0.1:8000/docs>

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # dev server on http://127.0.0.1:5173 (proxies /api -> :8000)
```

Or build it once and let the backend serve it as a single app:

```bash
cd frontend && npm run build
# then open http://127.0.0.1:8000  (uvicorn serves frontend/dist)
```

---

## How it works (the 4 steps in the UI)

1. **Profile & Resume** — drag in your resume; verify the extracted fields; add
   your LinkedIn / GitHub / website links.
2. **Find Jobs** — search by keywords + location (remote toggle). Each result
   shows a 0–100 match score, matched/missing skills, and the reasoning.
3. **Draft application** — pick a job to generate a tailored cover letter and a
   complete, pre-filled application form.
4. **Review & approve** — edit any field or the cover letter, fill the questions
   that need your judgment (work authorization, sponsorship, …), then
   **Approve & submit** or **Reject**. Required fields are enforced before
   approval.

---

## Configuration

All settings are optional (see `backend/.env.example`):

- `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `LLM_MODEL` — enable LLM cover letters
  (any OpenAI-compatible endpoint).
- `CORS_ORIGINS` — comma-separated allowed origins (default `*`).
- `ENABLE_BROWSER_SUBMIT` — keep `false` (see below).

---

## Responsible use & LinkedIn terms

LinkedIn's User Agreement prohibits automated actions on logged-in accounts
(auto-applying, scraping private data, etc.). AutoApply is built to stay on the
right side of that:

- Job **discovery** uses only LinkedIn's public, unauthenticated job-search
  endpoint — public listings, no login, no private data.
- The app **never auto-submits**. It prepares a fully-reviewed package and
  requires your explicit approval. By default it then hands you the apply link
  plus your reviewed answers/cover letter to finish in **your own** logged-in
  session.
- `ENABLE_BROWSER_SUBMIT` is an opt-in extension point (left unimplemented on
  purpose). Only enable automated browser submission if you have reviewed and
  accept LinkedIn's terms and the associated account risk.

Use this tool to save yourself time drafting and tailoring — not to spam
applications.

---

## Roadmap / extension points

- Implement the Playwright Easy-Apply driver in `application._browser_submit`.
- Swap the JSON store for a database for multi-user use.
- Add embeddings-based matching for higher-quality ranking.
```
