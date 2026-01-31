const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

export type Application = {
  id: number;
  company_name: string;
  role_title: string;
  status: string;
  applied_at: string;
  created_at: string;
  updated_at: string;
  job_url: string | null;
  job_description: string | null;
};

export function listApplications() {
  return request<Application[]>("/applications");
}

export function getApplication(id: number) {
  return request<Application>(`/applications/${id}`);
}

export function createApplication(payload: {
  company_name: string;
  role_title: string;
  status: string;
  applied_at: string;
  job_url?: string | null;
  job_description?: string | null;
  note?: string | null;
}) {
  return request<Application>("/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateApplication(
  id: number,
  payload: {
    company_name?: string;
    role_title?: string;
    job_url?: string | null;
    job_description?: string | null;
    applied_at?: string;
  },
) {
  return request<Application>(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
