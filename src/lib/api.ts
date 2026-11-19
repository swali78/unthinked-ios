/** Client for the app's own API (`/api/v1`). The session rides along in an httpOnly cookie. */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { fieldErrors?: Record<string, string[]> },
  ) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method: opts.method ?? "GET",
    credentials: "same-origin",
    headers: opts.body === undefined ? undefined : { "content-type": "application/json" },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = data?.error ?? {};
    throw new ApiError(res.status, e.code ?? "http_error", e.message ?? `Request failed (${res.status}).`, e.details);
  }
  return data as T;
}
