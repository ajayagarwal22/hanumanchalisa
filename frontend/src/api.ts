import type {
  AnswerRecord,
  Application,
  CandidateProfile,
  FormField,
  ScoredJob,
} from "./types";

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export const api = {
  health: () =>
    req<{ llm_enabled: boolean; browser_submit_enabled: boolean }>(
      "/api/health"
    ),

  getProfile: () => req<CandidateProfile>("/api/profile"),

  uploadResume: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return req<CandidateProfile>("/api/profile/resume", {
      method: "POST",
      body: fd,
    });
  },

  saveProfile: (profile: CandidateProfile) =>
    req<CandidateProfile>("/api/profile", {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(profile),
    }),

  searchJobs: (body: {
    keywords: string;
    location: string;
    remote: boolean;
    limit: number;
    use_profile: boolean;
  }) =>
    req<ScoredJob[]>("/api/jobs/search", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    }),

  buildApplication: (job_id: string, tone: string) =>
    req<Application>("/api/applications/build", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ job_id, generate_cover_letter: true, tone }),
    }),

  coverLetter: (job_id: string, tone: string, extra_notes: string) =>
    req<{ content: string; generated_with: string }>(
      "/api/applications/cover-letter",
      {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ job_id, tone, extra_notes }),
      }
    ),

  listApplications: () => req<Application[]>("/api/applications"),

  decide: (
    app_id: string,
    approve: boolean,
    edited_fields: FormField[],
    edited_cover_letter: string
  ) =>
    req<Application>(`/api/applications/${app_id}/approve`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        approve,
        edited_fields,
        edited_cover_letter,
      }),
    }),

  addQuestion: (
    app_id: string,
    label: string,
    type: string,
    options: string[]
  ) =>
    req<Application>(`/api/applications/${app_id}/questions`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ label, type, options, required: true }),
    }),

  listMemory: () => req<AnswerRecord[]>("/api/memory"),

  upsertMemory: (question: string, value: unknown, type = "text", options: string[] = []) =>
    req<AnswerRecord>("/api/memory", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ question, value, type, options }),
    }),

  forgetMemory: (key: string) =>
    req<{ removed: boolean }>("/api/memory", {
      method: "DELETE",
      headers: JSON_HEADERS,
      body: JSON.stringify({ key }),
    }),
};
