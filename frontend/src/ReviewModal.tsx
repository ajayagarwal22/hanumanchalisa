import { useEffect, useState } from "react";
import { api, type AutofillReport } from "./api";
import type { Application, FormField } from "./types";

export function ReviewModal({
  app,
  browserSubmit,
  onClose,
  onDecided,
  notify,
}: {
  app: Application;
  browserSubmit: boolean;
  onClose: () => void;
  onDecided: (a: Application) => void;
  notify: (m: string, e?: boolean) => void;
}) {
  const [fields, setFields] = useState<FormField[]>(app.fields);
  const [cover, setCover] = useState(app.cover_letter ?? "");
  const [busy, setBusy] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newQType, setNewQType] = useState("text");
  const [newQOptions, setNewQOptions] = useState("");
  const [addingQ, setAddingQ] = useState(false);

  const [pwAvailable, setPwAvailable] = useState<boolean | null>(null);
  const [autofilling, setAutofilling] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [report, setReport] = useState<AutofillReport | null>(null);

  useEffect(() => {
    api
      .automationStatus()
      .then((s) => setPwAvailable(s.playwright_available))
      .catch(() => setPwAvailable(false));
  }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      const r = await api.automationConnect();
      notify(r.message, !r.ok);
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setConnecting(false);
    }
  };

  const autofill = async () => {
    setAutofilling(true);
    setReport(null);
    try {
      const r = await api.automationAutofill(app.job.id, cover);
      setReport(r);
      notify(r.message, !r.ok);
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setAutofilling(false);
    }
  };

  const decided = app.status === "submitted" || app.status === "rejected";

  const setField = (name: string, value: unknown) =>
    setFields((fs) =>
      fs.map((f) => (f.name === name ? { ...f, value, from_memory: false } : f))
    );

  const addQuestion = async () => {
    if (!newQ.trim()) return;
    setAddingQ(true);
    try {
      const opts =
        newQType === "select"
          ? newQOptions.split(",").map((o) => o.trim()).filter(Boolean)
          : [];
      const updated = await api.addQuestion(app.id, newQ.trim(), newQType, opts);
      setFields(updated.fields);
      const added = updated.fields.find(
        (f) => f.label.toLowerCase() === newQ.trim().toLowerCase()
      );
      notify(
        added?.from_memory
          ? "Question added and auto-filled from your saved answers."
          : "Question added — provide your answer below."
      );
      setNewQ("");
      setNewQOptions("");
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setAddingQ(false);
    }
  };

  const missing = fields.filter(
    (f) => f.required && !(f.value && String(f.value).trim())
  );

  const decide = async (approve: boolean) => {
    if (approve && missing.length) {
      notify(`Fill required fields: ${missing.map((m) => m.label).join(", ")}`, true);
      return;
    }
    setBusy(true);
    try {
      const updated = await api.decide(app.id, approve, fields, cover);
      onDecided(updated);
      notify(
        approve
          ? "Approved. " +
              (browserSubmit
                ? "Submission attempted."
                : "Reviewed package is ready to finish in your LinkedIn session.")
          : "Draft rejected — nothing submitted."
      );
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <h2>{app.job.title}</h2>
            <div className="muted">
              {app.job.company}
              {app.job.location ? ` · ${app.job.location}` : ""}
            </div>
          </div>
          <span className={"status " + app.status}>{app.status.replace("_", " ")}</span>
        </div>

        {app.notes && <div className="notice">{app.notes}</div>}

        <h3 style={{ marginTop: 22 }}>Application form</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Pre-filled from your profile. Fields flagged below need your input
          before submitting.
        </p>

        {fields
          .filter((f) => f.name !== "cover_letter")
          .map((f) => {
            const lowConf = f.confidence < 0.5;
            return (
              <div className="field-row" key={f.name}>
                <label className="field">
                  {f.label}
                  {f.required && <span style={{ color: "var(--bad)" }}> *</span>}
                  {f.from_memory && <span className="flag mem">↺ from memory</span>}
                  {lowConf && !f.from_memory && (
                    <span className="flag">⚠ please verify</span>
                  )}
                </label>
                {f.type === "select" ? (
                  <select
                    disabled={decided}
                    value={(f.value as string) ?? ""}
                    onChange={(e) => setField(f.name, e.target.value)}
                  >
                    <option value="">— select —</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : f.type === "file" ? (
                  <input disabled value={(f.value as string) ?? "(no resume on file)"} />
                ) : (
                  <input
                    disabled={decided}
                    value={(f.value as string) ?? ""}
                    onChange={(e) => setField(f.name, e.target.value)}
                  />
                )}
              </div>
            );
          })}

        {!decided && (
          <div className="addq">
            <strong style={{ fontSize: 14 }}>Encountered a new question?</strong>
            <p className="muted" style={{ fontSize: 12, margin: "4px 0 10px" }}>
              Paste it here. If you've answered something similar before it
              auto-fills; otherwise answer it once and it's saved for next time.
            </p>
            <div className="addq-row">
              <input
                placeholder="e.g. What is your expected salary?"
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addQuestion()}
              />
              <select
                style={{ width: 130 }}
                value={newQType}
                onChange={(e) => setNewQType(e.target.value)}
              >
                <option value="text">Short text</option>
                <option value="textarea">Long text</option>
                <option value="select">Choice</option>
              </select>
              <button className="btn" onClick={addQuestion} disabled={addingQ}>
                {addingQ ? "Adding…" : "Add"}
              </button>
            </div>
            {newQType === "select" && (
              <input
                style={{ marginTop: 8 }}
                placeholder="Comma-separated options, e.g. Yes, No"
                value={newQOptions}
                onChange={(e) => setNewQOptions(e.target.value)}
              />
            )}
          </div>
        )}

        <h3 style={{ marginTop: 18 }}>Tailored cover letter</h3>
        <textarea
          disabled={decided}
          style={{ minHeight: 220 }}
          value={cover}
          onChange={(e) => setCover(e.target.value)}
        />

        {app.submission_log.length > 0 && (
          <div className="log">{app.submission_log.join("\n")}</div>
        )}

        <div className="notice">
          Nothing is sent to LinkedIn without your approval. On approval your
          question answers are saved to memory and auto-filled next time.
          {browserSubmit
            ? " Automated submission is enabled."
            : " The reviewed answers + cover letter are finalized for you to submit in your own logged-in LinkedIn session (respecting LinkedIn's terms)."}
        </div>

        <div className="autofill">
          <strong style={{ fontSize: 14 }}>Auto-fill in your browser</strong>
          <p className="muted" style={{ fontSize: 12, margin: "4px 0 10px" }}>
            Opens the real application (LinkedIn Easy Apply or the external site),
            fills every field it can from your profile, saved answers and this
            cover letter, then stops so <strong>you</strong> review and submit. It
            never submits for you.
          </p>
          {pwAvailable === false && (
            <div className="notice" style={{ marginTop: 0 }}>
              Browser auto-fill needs Playwright on the machine running the app:
              <code> pip install playwright &amp;&amp; playwright install chromium</code>.
              Run natively (<code>./run.sh</code>), not headless Docker.
            </div>
          )}
          <div className="btn-row">
            <button className="btn" onClick={connect} disabled={connecting || !pwAvailable}>
              {connecting ? "Opening…" : "1 · Connect LinkedIn"}
            </button>
            <button
              className="btn primary"
              onClick={autofill}
              disabled={autofilling || !pwAvailable}
            >
              {autofilling ? (
                <>
                  <span className="spinner" /> Filling…
                </>
              ) : (
                "2 · Auto-fill this application"
              )}
            </button>
            {report && (
              <button className="btn ghost" onClick={() => api.automationClose()}>
                Close browser
              </button>
            )}
          </div>

          {report && (
            <div className="report">
              <div>
                <strong>{report.filled?.length ?? 0}</strong> fields filled
                {report.mode ? ` · ${report.mode.replace("_", " ")}` : ""}
                {report.ready_to_submit ? " · ready for your review & submit" : ""}
              </div>
              {report.external_url && (
                <div className="muted" style={{ fontSize: 12 }}>
                  External form: {report.external_url}
                </div>
              )}
              {!!report.filled?.length && (
                <details>
                  <summary>Filled fields</summary>
                  <ul className="reasons">
                    {report.filled.map((f, i) => (
                      <li key={i}>
                        {f.label}: <span className="muted">{f.value}</span> ({f.source})
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {!!report.unmatched?.length && (
                <details open>
                  <summary>
                    Needs your input in the browser ({report.unmatched.length})
                  </summary>
                  <ul className="reasons">
                    {report.unmatched.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </details>
              )}
              {!!report.notes?.length && (
                <details>
                  <summary>Diagnostics</summary>
                  {report.page_url && (
                    <div className="muted" style={{ fontSize: 12 }}>
                      Page: {report.page_url}
                    </div>
                  )}
                  <ul className="reasons">
                    {report.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="btn-row" style={{ marginTop: 16 }}>
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
          {!decided && (
            <>
              <button className="btn" onClick={() => decide(false)} disabled={busy}>
                Reject draft
              </button>
              <button className="btn good" onClick={() => decide(true)} disabled={busy}>
                {busy ? (
                  <>
                    <span className="spinner" /> Submitting…
                  </>
                ) : (
                  "✓ Approve & submit"
                )}
              </button>
            </>
          )}
          {app.status === "submitted" && (
            <a className="btn primary" href={app.job.url} target="_blank" rel="noreferrer">
              Open job to finish ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
