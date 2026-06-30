import { useEffect, useState } from "react";
import { api } from "./api";
import type {
  AnswerRecord,
  Application,
  CandidateProfile,
  FormField,
  ScoredJob,
} from "./types";
import { ReviewModal } from "./ReviewModal";

type Step = "profile" | "jobs" | "applications" | "memory";

const STEPS: { id: Step; title: string; sub: string }[] = [
  { id: "profile", title: "Profile & Resume", sub: "Upload + links" },
  { id: "jobs", title: "Find Jobs", sub: "Search & match" },
  { id: "applications", title: "Applications", sub: "Review & approve" },
  { id: "memory", title: "Saved Answers", sub: "Reused auto-fill" },
];

export default function App() {
  const [step, setStep] = useState<Step>("profile");
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [health, setHealth] = useState<{
    llm_enabled: boolean;
    browser_submit_enabled: boolean;
  } | null>(null);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
  const [results, setResults] = useState<ScoredJob[]>([]);
  const [reviewApp, setReviewApp] = useState<Application | null>(null);
  const [apps, setApps] = useState<Application[]>([]);

  const notify = (msg: string, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 4200);
  };

  useEffect(() => {
    api.health().then(setHealth).catch(() => {});
    api.getProfile().then(setProfile).catch(() => {});
    api.listApplications().then(setApps).catch(() => {});
  }, []);

  const refreshApps = () => api.listApplications().then(setApps).catch(() => {});

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="logo">A</div>
          <div>
            <h1>AutoApply</h1>
            <p>Resume-driven LinkedIn job applications — with your approval</p>
          </div>
        </div>
        <div className="badges">
          <span className={"badge" + (health?.llm_enabled ? " on" : "")}>
            {health?.llm_enabled ? "LLM cover letters" : "Template cover letters"}
          </span>
          <span className="badge">Approval-gated submit</span>
        </div>
      </div>

      <div className="steps">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={"step-pill" + (step === s.id ? " active" : "")}
            onClick={() => setStep(s.id)}
          >
            <div className="step-num">{i + 1}</div>
            <div>
              <strong>{s.title}</strong>
              <small>{s.sub}</small>
            </div>
          </div>
        ))}
      </div>

      {step === "profile" && (
        <ProfileStep
          profile={profile}
          onChange={setProfile}
          notify={notify}
          onContinue={() => setStep("jobs")}
        />
      )}

      {step === "jobs" && (
        <JobsStep
          profile={profile}
          results={results}
          setResults={setResults}
          notify={notify}
          llm={!!health?.llm_enabled}
          onBuilt={async (app) => {
            await refreshApps();
            setReviewApp(app);
          }}
        />
      )}

      {step === "applications" && (
        <ApplicationsStep apps={apps} onOpen={setReviewApp} onRefresh={refreshApps} />
      )}

      {step === "memory" && <MemoryStep notify={notify} />}

      {reviewApp && (
        <ReviewModal
          app={reviewApp}
          browserSubmit={!!health?.browser_submit_enabled}
          onClose={() => setReviewApp(null)}
          notify={notify}
          onDecided={async (updated) => {
            await refreshApps();
            setReviewApp(updated);
          }}
        />
      )}

      {toast && <div className={"toast" + (toast.err ? " err" : "")}>{toast.msg}</div>}
    </div>
  );
}

/* ----------------------------- Profile step ----------------------------- */

function ProfileStep({
  profile,
  onChange,
  notify,
  onContinue,
}: {
  profile: CandidateProfile | null;
  onChange: (p: CandidateProfile) => void;
  notify: (m: string, e?: boolean) => void;
  onContinue: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState(false);

  const p = profile ?? emptyProfile();

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const updated = await api.uploadResume(file);
      onChange(updated);
      notify(`Parsed ${file.name} — review the extracted details below.`);
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await api.saveProfile(p);
      onChange(saved);
      notify("Profile saved.");
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setSaving(false);
    }
  };

  const set = (patch: Partial<CandidateProfile>) => onChange({ ...p, ...patch });
  const setLink = (k: "linkedin" | "github" | "website", v: string) =>
    onChange({ ...p, links: { ...p.links, [k]: v || null } });

  return (
    <div className="panel">
      <h2>Your profile</h2>
      <p className="sub">
        Upload your resume (PDF, DOCX or TXT). We extract your details — edit
        anything that looks off, then add your links.
      </p>

      <div
        className={"dropzone" + (drag ? " drag" : "")}
        onClick={() => document.getElementById("resume-input")?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]);
        }}
      >
        {uploading ? (
          <span>
            <span className="spinner" /> &nbsp;Parsing resume…
          </span>
        ) : p.resume_filename ? (
          <>
            <strong>{p.resume_filename}</strong> uploaded — click to replace
          </>
        ) : (
          <>
            <strong>Drop your resume here</strong> or click to browse
            <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
              PDF · DOCX · TXT (max 10 MB)
            </div>
          </>
        )}
        <input
          id="resume-input"
          type="file"
          accept=".pdf,.docx,.txt"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>

      <div className="grid" style={{ marginTop: 20 }}>
        <div className="row">
          <label className="field">Full name</label>
          <input value={p.full_name ?? ""} onChange={(e) => set({ full_name: e.target.value })} />
        </div>
        <div className="row">
          <label className="field">Headline / target title</label>
          <input value={p.headline ?? ""} onChange={(e) => set({ headline: e.target.value })} />
        </div>
        <div className="row">
          <label className="field">Email</label>
          <input value={p.email ?? ""} onChange={(e) => set({ email: e.target.value })} />
        </div>
        <div className="row">
          <label className="field">Phone</label>
          <input value={p.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} />
        </div>
        <div className="row">
          <label className="field">Location</label>
          <input value={p.location ?? ""} onChange={(e) => set({ location: e.target.value })} />
        </div>
        <div className="row">
          <label className="field">Years of experience</label>
          <input
            type="number"
            value={p.years_experience ?? ""}
            onChange={(e) =>
              set({ years_experience: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div className="row">
          <label className="field">LinkedIn URL</label>
          <input
            placeholder="https://linkedin.com/in/you"
            value={p.links.linkedin ?? ""}
            onChange={(e) => setLink("linkedin", e.target.value)}
          />
        </div>
        <div className="row">
          <label className="field">GitHub URL</label>
          <input
            placeholder="https://github.com/you"
            value={p.links.github ?? ""}
            onChange={(e) => setLink("github", e.target.value)}
          />
        </div>
        <div className="row">
          <label className="field">Website / Portfolio</label>
          <input
            placeholder="https://you.dev"
            value={p.links.website ?? ""}
            onChange={(e) => setLink("website", e.target.value)}
          />
        </div>
      </div>

      <div className="row">
        <label className="field">Detected skills</label>
        <div className="chips">
          {p.skills.length ? (
            p.skills.map((s) => (
              <span key={s} className="chip good">
                {s}
              </span>
            ))
          ) : (
            <span className="muted">No skills detected yet — upload a resume.</span>
          )}
        </div>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
        <button
          className="btn primary"
          onClick={async () => {
            await save();
            onContinue();
          }}
          disabled={!p.resume_filename}
        >
          Continue to job search →
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ Jobs step ------------------------------ */

function JobsStep({
  profile,
  results,
  setResults,
  notify,
  llm,
  onBuilt,
}: {
  profile: CandidateProfile | null;
  results: ScoredJob[];
  setResults: (r: ScoredJob[]) => void;
  notify: (m: string, e?: boolean) => void;
  llm: boolean;
  onBuilt: (a: Application) => void;
}) {
  const [keywords, setKeywords] = useState(profile?.headline ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [remote, setRemote] = useState(false);
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [buildingId, setBuildingId] = useState<string | null>(null);

  const search = async () => {
    setLoading(true);
    try {
      const r = await api.searchJobs({
        keywords,
        location,
        remote,
        limit: 20,
        use_profile: true,
      });
      setResults(r);
      if (!r.length) notify("No jobs found — try different keywords.", true);
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setLoading(false);
    }
  };

  const build = async (jobId: string) => {
    setBuildingId(jobId);
    try {
      const app = await api.buildApplication(jobId, tone);
      notify(`Drafted application with ${llm ? "AI" : "tailored"} cover letter.`);
      onBuilt(app);
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBuildingId(null);
    }
  };

  return (
    <div className="panel">
      <h2>Find matching jobs on LinkedIn</h2>
      <p className="sub">
        We search public LinkedIn listings and score each against your resume.
      </p>

      <div className="grid">
        <div className="row">
          <label className="field">Keywords (role / skills)</label>
          <input
            value={keywords}
            placeholder="e.g. backend engineer python"
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
        </div>
        <div className="row">
          <label className="field">Location</label>
          <input
            value={location}
            placeholder="e.g. London, or leave blank"
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>
      <div className="btn-row">
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={remote}
            onChange={(e) => setRemote(e.target.checked)}
          />
          Remote only
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Cover letter tone:
          <select
            style={{ width: "auto" }}
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="professional">Professional</option>
            <option value="enthusiastic">Enthusiastic</option>
            <option value="concise">Concise</option>
          </select>
        </label>
        <button className="btn primary" onClick={search} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" /> Searching…
            </>
          ) : (
            "Search jobs"
          )}
        </button>
      </div>

      <div style={{ marginTop: 22 }}>
        {results.length === 0 && !loading && (
          <div className="empty">Run a search to see matched jobs.</div>
        )}
        {results.map((sj) => (
          <div className="job" key={sj.job.id}>
            <div className="job-head">
              <div style={{ flex: 1 }}>
                <h3>{sj.job.title}</h3>
                <div className="meta">
                  {sj.job.company}
                  {sj.job.location ? ` · ${sj.job.location}` : ""}
                  {sj.job.source === "sample" ? " · (sample)" : ""}
                </div>
              </div>
              <div className="score">
                <div className="num" style={{ color: scoreColor(sj.score) }}>
                  {Math.round(sj.score)}
                </div>
                <div className="lbl">match</div>
              </div>
            </div>
            <div className="bar">
              <span style={{ width: `${sj.score}%` }} />
            </div>
            <div className="chips" style={{ marginTop: 10 }}>
              {sj.matched_skills.slice(0, 8).map((s) => (
                <span key={s} className="chip good">
                  ✓ {s}
                </span>
              ))}
              {sj.missing_skills.slice(0, 5).map((s) => (
                <span key={s} className="chip miss">
                  + {s}
                </span>
              ))}
            </div>
            <ul className="reasons">
              {sj.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <div className="btn-row">
              <a className="btn ghost" href={sj.job.url} target="_blank" rel="noreferrer">
                View on LinkedIn ↗
              </a>
              <button
                className="btn primary"
                onClick={() => build(sj.job.id)}
                disabled={buildingId === sj.job.id}
              >
                {buildingId === sj.job.id ? (
                  <>
                    <span className="spinner" /> Drafting…
                  </>
                ) : (
                  "Draft application →"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------- Applications step -------------------------- */

function ApplicationsStep({
  apps,
  onOpen,
  onRefresh,
}: {
  apps: Application[];
  onOpen: (a: Application) => void;
  onRefresh: () => void;
}) {
  useEffect(() => {
    onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="panel">
      <h2>Your applications</h2>
      <p className="sub">Every draft waits for your explicit approval before submission.</p>
      {apps.length === 0 && <div className="empty">No applications yet.</div>}
      {apps.map((a) => (
        <div className="job" key={a.id}>
          <div className="job-head">
            <div>
              <h3>{a.job.title}</h3>
              <div className="meta">
                {a.job.company}
                {a.job.location ? ` · ${a.job.location}` : ""}
              </div>
            </div>
            <span className={"status " + a.status}>{a.status.replace("_", " ")}</span>
          </div>
          <div className="btn-row">
            <button className="btn primary" onClick={() => onOpen(a)}>
              {a.status === "awaiting_approval" ? "Review & approve →" : "Open"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- Memory step ----------------------------- */

function MemoryStep({ notify }: { notify: (m: string, e?: boolean) => void }) {
  const [items, setItems] = useState<AnswerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [v, setV] = useState("");

  const load = () => {
    setLoading(true);
    api
      .listMemory()
      .then(setItems)
      .catch((e) => notify((e as Error).message, true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async () => {
    if (!q.trim()) return;
    try {
      await api.upsertMemory(q.trim(), v);
      notify("Saved answer.");
      setQ("");
      setV("");
      load();
    } catch (e) {
      notify((e as Error).message, true);
    }
  };

  const forget = async (key: string) => {
    try {
      await api.forgetMemory(key);
      load();
    } catch (e) {
      notify((e as Error).message, true);
    }
  };

  const edit = async (rec: AnswerRecord, value: string) => {
    try {
      await api.upsertMemory(rec.question, value, rec.type, rec.options);
      setItems((xs) =>
        xs.map((x) => (x.key === rec.key ? { ...x, value } : x))
      );
    } catch (e) {
      notify((e as Error).message, true);
    }
  };

  return (
    <div className="panel">
      <h2>Saved answers</h2>
      <p className="sub">
        Answers you approve are stored here and auto-filled on future
        applications (matched even when a question is slightly reworded). Edit or
        remove any of them.
      </p>

      <div className="addq" style={{ marginTop: 0 }}>
        <strong style={{ fontSize: 14 }}>Add an answer ahead of time</strong>
        <div className="addq-row" style={{ marginTop: 10 }}>
          <input
            placeholder="Question, e.g. What are your salary expectations?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <input
            placeholder="Your answer"
            value={v}
            onChange={(e) => setV(e.target.value)}
            style={{ flex: 1, minWidth: 160 }}
          />
          <button className="btn" onClick={add}>
            Save
          </button>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        {loading && <div className="empty">Loading…</div>}
        {!loading && items.length === 0 && (
          <div className="empty">
            No saved answers yet. Approve an application with custom questions and
            they'll appear here.
          </div>
        )}
        {items.map((rec) => (
          <div className="mem-item" key={rec.key}>
            <div className="q">{rec.question}</div>
            <input
              className="a"
              style={{ marginTop: 6 }}
              defaultValue={String(rec.value ?? "")}
              onBlur={(e) => edit(rec, e.target.value)}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <span className="uses">
                used {rec.uses} time{rec.uses === 1 ? "" : "s"}
              </span>
              <button className="btn ghost" onClick={() => forget(rec.key)}>
                Forget
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ helpers ------------------------------ */

function scoreColor(score: number): string {
  if (score >= 60) return "#34d399";
  if (score >= 35) return "#fbbf24";
  return "#f87171";
}

function emptyProfile(): CandidateProfile {
  return {
    full_name: "",
    email: "",
    phone: "",
    location: "",
    headline: "",
    summary: "",
    links: { linkedin: "", github: "", website: "" },
    skills: [],
    titles: [],
    years_experience: null,
    resume_filename: null,
  };
}

export type { FormField };
