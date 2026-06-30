"""Browser auto-fill for job applications (Playwright).

Opens a real browser, navigates to a job, and **fills** the application form —
LinkedIn *Easy Apply* or an external ATS reached via the "Apply" link — from the
candidate profile and saved answer memory. It deliberately **never clicks the
final Submit**: the filled form is left on screen for the human to review and
submit.

Design notes:

- A single persistent browser context (``launch_persistent_context``) keeps the
  LinkedIn login between runs; the user logs in once in the opened window and the
  session cookies live in ``browser_user_data_dir`` (no password is stored by
  this app).
- The context is held in a module-level singleton so it stays open after an
  auto-fill request returns, letting the user finish in the same window.
- Playwright is an optional dependency; importing happens lazily so the rest of
  the app runs without it installed.
- This requires a display, so run natively (``./run.sh``) rather than headless
  Docker for the auto-fill feature.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from ..config import UPLOAD_DIR, get_settings
from ..models import CandidateProfile

# JS to derive the best human-readable label for a form control.
_LABEL_JS = r"""
(el) => {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  if (el.id) {
    try {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l && clean(l.innerText)) return clean(l.innerText);
    } catch (e) {}
  }
  const aria = el.getAttribute('aria-label');
  if (clean(aria)) return clean(aria);
  const lb = el.getAttribute('aria-labelledby');
  if (lb) {
    const parts = lb.split(/\s+/).map((id) => document.getElementById(id))
      .filter(Boolean).map((n) => n.innerText);
    if (clean(parts.join(' '))) return clean(parts.join(' '));
  }
  const wrap = el.closest('label');
  if (wrap && clean(wrap.innerText)) return clean(wrap.innerText);
  // LinkedIn groups: legend within the enclosing fieldset / form element block
  const fs = el.closest('fieldset');
  if (fs) {
    const lg = fs.querySelector('legend, .fb-dash-form-element__label, label');
    if (lg && clean(lg.innerText)) return clean(lg.innerText);
  }
  if (clean(el.placeholder)) return clean(el.placeholder);
  if (clean(el.name)) return clean(el.name);
  return '';
}
"""


def _has(label: str, *keywords: str) -> bool:
    return any(k in label for k in keywords)


def match_value(
    label: str, profile: CandidateProfile, store, extras: dict[str, Any] | None = None
) -> tuple[Any, str]:
    """Return (value, source) for a field label. source in profile|memory|cover|none."""
    L = label.lower()
    name = profile.full_name or ""
    parts = name.split()

    if extras and extras.get("cover_letter") and _has(L, "cover letter", "why do you want", "motivation"):
        return extras["cover_letter"], "cover"

    if _has(L, "email"):
        return profile.email, "profile"
    if _has(L, "phone", "mobile", "telephone", "contact number"):
        return profile.phone, "profile"
    if _has(L, "first name", "given name", "forename"):
        return (parts[0] if parts else ""), "profile"
    if _has(L, "last name", "surname", "family name"):
        return (parts[-1] if len(parts) > 1 else ""), "profile"
    if _has(L, "full name", "your name") or (
        _has(L, "name") and not _has(L, "company", "user", "file", "first", "last")
    ):
        return name, "profile"
    if _has(L, "linkedin"):
        return profile.links.linkedin, "profile"
    if _has(L, "github"):
        return profile.links.github, "profile"
    if _has(L, "portfolio", "website", "personal site", "url"):
        return profile.links.website, "profile"
    if _has(L, "city", "location", "where are you based", "current location"):
        return profile.location, "profile"
    if _has(L, "years of experience", "years experience", "total experience"):
        return (str(int(profile.years_experience)) if profile.years_experience else None), "profile"

    rec = store.lookup_answer(label)
    if rec is not None and rec.value not in (None, ""):
        return rec.value, "memory"
    return None, "none"


def _resume_path(profile: CandidateProfile) -> Path | None:
    if not profile.resume_filename:
        return None
    p = UPLOAD_DIR / profile.resume_filename
    return p if p.exists() else None


class BrowserSession:
    def __init__(self) -> None:
        self._pw = None
        self.context = None

    @property
    def started(self) -> bool:
        return self.context is not None

    async def start(self) -> None:
        if self.started:
            return
        from playwright.async_api import async_playwright  # lazy import

        settings = get_settings()
        self._pw = await async_playwright().start()
        user_dir = Path(settings.browser_user_data_dir)
        user_dir.mkdir(parents=True, exist_ok=True)
        self.context = await self._pw.chromium.launch_persistent_context(
            user_data_dir=str(user_dir),
            headless=settings.browser_headless,
            viewport={"width": 1320, "height": 940},
            args=["--disable-blink-features=AutomationControlled"],
        )

    async def page(self):
        if not self.started:
            await self.start()
        pages = self.context.pages
        return pages[0] if pages else await self.context.new_page()

    async def close(self) -> None:
        try:
            if self.context:
                await self.context.close()
            if self._pw:
                await self._pw.stop()
        finally:
            self.context = None
            self._pw = None


_session: BrowserSession | None = None


def get_session() -> BrowserSession:
    global _session
    if _session is None:
        _session = BrowserSession()
    return _session


def playwright_available() -> bool:
    try:
        import playwright.async_api  # noqa: F401

        return True
    except Exception:
        return False


async def is_logged_in(page) -> bool:
    try:
        await page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded", timeout=30000)
    except Exception:
        return False
    url = page.url
    return "/feed" in url and "login" not in url and "authwall" not in url


async def connect_linkedin() -> dict:
    """Open the browser and ensure the user is logged in to LinkedIn."""
    if not playwright_available():
        return {"ok": False, "logged_in": False, "message": _install_hint()}
    session = get_session()
    try:
        await session.start()
        page = await session.page()
        if await is_logged_in(page):
            return {"ok": True, "logged_in": True, "message": "LinkedIn session is active."}
        await page.goto("https://www.linkedin.com/login", wait_until="domcontentloaded")
        return {
            "ok": True,
            "logged_in": False,
            "message": "A browser window opened. Log in to LinkedIn there, then retry auto-fill.",
        }
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "logged_in": False, "message": f"Could not start browser: {exc}"}


# ----------------------------- form filling -----------------------------


async def _fill_inputs(page, scope, profile, store, report, extras=None) -> None:
    elements = await scope.query_selector_all("input, textarea, select")
    for el in elements:
        try:
            if not await el.is_visible():
                continue
            tag = (await el.evaluate("e => e.tagName")).lower()
            typ = (await el.get_attribute("type") or "text").lower()

            if tag == "input" and typ in (
                "hidden", "submit", "button", "image", "password", "reset", "search",
            ):
                continue

            if tag == "input" and typ == "file":
                resume = _resume_path(profile)
                if resume:
                    try:
                        await el.set_input_files(str(resume))
                        report["filled"].append(
                            {"label": "Resume", "value": resume.name, "source": "resume"}
                        )
                    except Exception:
                        pass
                continue

            label = (await el.evaluate(_LABEL_JS) or "").strip()
            if not label:
                continue

            if tag == "input" and typ in ("checkbox", "radio"):
                continue  # handled by _fill_choice_groups

            value, source = match_value(label, profile, store, extras)
            if value in (None, ""):
                if label not in report["unmatched"]:
                    report["unmatched"].append(label)
                continue

            if tag == "select":
                ok = await _select_option(el, str(value))
                bucket = "filled" if ok else "unmatched"
                if ok:
                    report["filled"].append({"label": label, "value": str(value), "source": source})
                elif label not in report["unmatched"]:
                    report["unmatched"].append(label)
                continue

            current = ""
            try:
                current = (await el.input_value()) or ""
            except Exception:
                current = ""
            if current.strip():
                report["skipped_prefilled"].append(label)
                continue
            await el.fill(str(value))
            report["filled"].append({"label": label, "value": str(value), "source": source})
        except Exception:
            continue


async def _select_option(el, value: str) -> bool:
    val = value.strip().lower()
    try:
        options = await el.query_selector_all("option")
        for opt in options:
            text = ((await opt.inner_text()) or "").strip().lower()
            oval = ((await opt.get_attribute("value")) or "").strip().lower()
            if val and (val == text or val == oval or (len(val) > 2 and val in text)):
                await el.select_option(value=await opt.get_attribute("value"))
                return True
    except Exception:
        return False
    return False


async def _fill_choice_groups(page, scope, profile, store, report, extras=None) -> None:
    """Handle radio-button question groups (common in Easy Apply, e.g. Yes/No)."""
    try:
        groups = await scope.query_selector_all("fieldset")
    except Exception:
        groups = []
    for fs in groups:
        try:
            radios = await fs.query_selector_all("input[type=radio]")
            if not radios:
                continue
            legend = await fs.query_selector("legend, label, .fb-dash-form-element__label")
            label = ((await legend.inner_text()) if legend else "") or ""
            label = label.replace("\n", " ").strip()
            if not label:
                continue
            value, source = match_value(label, profile, store, extras)
            if value in (None, ""):
                if label not in report["unmatched"]:
                    report["unmatched"].append(label)
                continue
            want = str(value).strip().lower()
            for r in radios:
                opt_label = (await r.evaluate(_LABEL_JS) or "").strip().lower()
                rval = ((await r.get_attribute("value")) or "").strip().lower()
                if want == opt_label or want == rval or (len(want) > 1 and want in opt_label):
                    try:
                        await r.check()
                        report["filled"].append(
                            {"label": label, "value": str(value), "source": source}
                        )
                    except Exception:
                        pass
                    break
        except Exception:
            continue


async def _fill_modal(page, profile, store, report, extras=None) -> None:
    modal = page.locator("div[role=dialog]").last
    scope = modal if await modal.count() > 0 else page
    handle = await scope.element_handle() if hasattr(scope, "element_handle") else page
    target = handle or page
    await _fill_inputs(page, target, profile, store, report, extras)
    await _fill_choice_groups(page, target, profile, store, report, extras)


async def autofill_easy_apply(page, profile, store, report, extras=None) -> None:
    report["mode"] = "easy_apply"
    btn = page.locator("button.jobs-apply-button, button:has-text('Easy Apply')").first
    try:
        await btn.click(timeout=10000)
    except Exception:
        report["message"] = "Could not open the Easy Apply dialog — open it manually, then re-run."
        return
    await page.wait_for_timeout(1500)

    for _ in range(10):
        await _fill_modal(page, profile, store, report, extras)
        submit = page.locator(
            "button[aria-label*='Submit application'], button:has-text('Submit application')"
        )
        if await submit.count() > 0:
            report["ready_to_submit"] = True
            report["message"] = (
                "Form filled. Review every answer in the browser, then click "
                "Submit application yourself."
            )
            return
        nxt = page.locator(
            "button[aria-label*='Continue to next step'], "
            "button[aria-label*='Review your application'], "
            "button:has-text('Review'), button:has-text('Next')"
        ).first
        if await nxt.count() == 0:
            break
        try:
            await nxt.click(timeout=8000)
        except Exception:
            break
        await page.wait_for_timeout(1200)

    report["message"] = (
        "Filled what I could. Some steps need your input — continue in the browser."
    )


async def autofill_external(page, context, profile, store, report, extras=None) -> None:
    report["mode"] = "external"
    apply_btn = page.locator(
        "button:has-text('Apply'), a:has-text('Apply'), "
        "a.jobs-apply-button, button.jobs-apply-button"
    ).first
    try:
        async with context.expect_page(timeout=15000) as new_page_info:
            await apply_btn.click(timeout=10000)
        ext = await new_page_info.value
    except Exception:
        # Some external applies navigate in the same tab instead of opening one.
        ext = page
    try:
        await ext.wait_for_load_state("domcontentloaded", timeout=30000)
    except Exception:
        pass
    await ext.wait_for_timeout(2000)
    report["external_url"] = ext.url
    await _fill_inputs(ext, ext, profile, store, report, extras)
    await _fill_choice_groups(ext, ext, profile, store, report, extras)
    report["message"] = (
        "Opened the external application and filled matching fields. Review, "
        "complete anything left, and submit on that site yourself."
    )


async def autofill_job(
    job_url: str, profile: CandidateProfile, store, cover_letter: str | None = None
) -> dict:
    if not playwright_available():
        return {"ok": False, "logged_in": False, "message": _install_hint()}
    if not profile.resume_filename:
        return {"ok": False, "message": "Upload a resume first."}

    extras = {"cover_letter": cover_letter} if cover_letter else None
    session = get_session()
    report: dict[str, Any] = {
        "ok": True,
        "logged_in": True,
        "mode": None,
        "filled": [],
        "unmatched": [],
        "skipped_prefilled": [],
        "ready_to_submit": False,
        "external_url": None,
        "message": "",
    }
    try:
        await session.start()
        page = await session.page()
        if "linkedin.com" in job_url and not await is_logged_in(page):
            return {
                "ok": False,
                "logged_in": False,
                "message": "Connect LinkedIn first (a browser window will open for login).",
            }
        await page.goto(job_url, wait_until="domcontentloaded", timeout=45000)
        await page.wait_for_timeout(2500)

        is_easy = await page.locator("button:has-text('Easy Apply')").count() > 0
        if is_easy:
            await autofill_easy_apply(page, profile, store, report, extras)
        else:
            await autofill_external(page, session.context, profile, store, report, extras)
        return report
    except Exception as exc:  # noqa: BLE001
        report["ok"] = False
        report["message"] = f"Auto-fill error: {exc}"
        return report


async def close_session() -> dict:
    session = get_session()
    await session.close()
    return {"ok": True, "message": "Browser closed."}


def _install_hint() -> str:
    return (
        "Browser auto-fill needs Playwright. Install it once: "
        "`pip install playwright` then `playwright install chromium`. "
        "Run the app natively (./run.sh), not headless Docker, so a window can open."
    )
