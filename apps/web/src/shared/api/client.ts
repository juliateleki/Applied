const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function healthCheck() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error("API error");
  return res.json() as Promise<{ status: string }>;
}
