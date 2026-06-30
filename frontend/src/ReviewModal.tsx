import { useState } from "react";
import { api } from "./api";
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

  const decided = app.status === "submitted" || app.status === "rejected";

  const setField = (name: string, value: unknown) =>
    setFields((fs) => fs.map((f) => (f.name === name ? { ...f, value } : f)));

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
                  {lowConf && <span className="flag">⚠ please verify</span>}
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
          Nothing is sent to LinkedIn without your approval.
          {browserSubmit
            ? " Automated submission is enabled."
            : " On approval, the reviewed answers + cover letter are finalized for you to submit in your own logged-in LinkedIn session (respecting LinkedIn's terms)."}
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
