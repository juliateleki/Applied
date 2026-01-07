const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function healthCheck() {
  const url = `${API_BASE_URL}/health`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status} at ${url}`);
  return res.json() as Promise<{ status: string }>;
}
