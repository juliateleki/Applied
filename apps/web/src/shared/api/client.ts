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
    throw new Error(
      `API error ${res.status} at ${url}${text ? `: ${text}` : ""}`,
    );
  }

  return (await res.json()) as T;
}

export type Application = {
  id: number;
  company_name: string;
  role_title: string;
  status: string;
};

export type ApplicationEvent = {
  id: number;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  occurred_at: string;
};

export function healthCheck() {
  return request<{ status: string }>("/health");
}

export function listApplications() {
  return request<Application[]>("/applications");
}

export function getApplication(id: number) {
  return request<Application>(`/applications/${id}`);
}

export function createApplication(payload: {
  company_name: string;
  role_title: string;
  status?: string;
  note?: string | null;
}) {
  return request<Application>("/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function changeStatus(
  id: number,
  payload: { to_status: string; note?: string | null },
) {
  return request<Application>(`/applications/${id}/status`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listEvents(id: number) {
  return request<ApplicationEvent[]>(`/applications/${id}/events`);
}
