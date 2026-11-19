import { z } from "zod";
import { type AuthUser, userFromRequest } from "./auth";
import { type Db, getDb } from "./db";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = "Not found") => new HttpError(404, "not_found", what);
export const forbidden = (what = "Not allowed") => new HttpError(403, "forbidden", what);

export type Ctx = {
  req: Request;
  db: Db;
  params: Record<string, string>;
  url: URL;
  /** Parse and validate the JSON body. Throws a 400 listing the problems. */
  body: <T extends z.ZodType>(schema: T) => Promise<z.infer<T>>;
};
export type AuthedCtx = Ctx & { user: AuthUser };

type Handler<C> = (ctx: C) => Promise<Response> | Response;
export type Route =
  | { method: string; path: string; auth: false; handler: Handler<Ctx> }
  | { method: string; path: string; auth: true; handler: Handler<AuthedCtx> };

export const route = {
  public: (method: string, path: string, handler: Handler<Ctx>): Route => ({ method, path, auth: false, handler }),
  authed: (method: string, path: string, handler: Handler<AuthedCtx>): Route => ({ method, path, auth: true, handler }),
};

export const json = (data: unknown, init?: ResponseInit) =>
  Response.json(data, { ...init, headers: { "cache-control": "no-store", ...init?.headers } });

function match(pattern: string, path: string) {
  const a = pattern.split("/").filter(Boolean);
  const b = path.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

/** A tiny router for `/api/v1/*`, so every endpoint shares auth, validation and error handling. */
export function createRouter(routes: Route[], base = "/api/v1") {
  return async function handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname.startsWith(base) ? url.pathname.slice(base.length) || "/" : url.pathname;
    try {
      let pathExists = false;
      for (const r of routes) {
        const params = match(r.path, path);
        if (!params) continue;
        pathExists = true;
        if (r.method !== req.method) continue;
        const db = await getDb();
        const body = async <T extends z.ZodType>(schema: T): Promise<z.infer<T>> => {
          let raw: unknown;
          try {
            raw = await req.json();
          } catch {
            throw new HttpError(400, "invalid_json", "The request body must be JSON.");
          }
          const parsed = schema.safeParse(raw);
          if (!parsed.success) throw new HttpError(400, "invalid_body", "Some fields are missing or invalid.", z.flattenError(parsed.error));
          return parsed.data;
        };
        const ctx: Ctx = { req, db, params, url, body };
        if (!r.auth) return await r.handler(ctx);
        const user = await userFromRequest(db, req);
        if (!user) throw new HttpError(401, "unauthorized", "Sign in to continue.");
        return await r.handler({ ...ctx, user });
      }
      if (pathExists) throw new HttpError(405, "method_not_allowed", `${req.method} isn't supported here.`);
      throw notFound(`No endpoint at ${path}.`);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: { code: err.code, message: err.message, details: err.details } }, { status: err.status });
      console.error("[api]", req.method, path, err);
      return json({ error: { code: "internal", message: "Something went wrong on our side." } }, { status: 500 });
    }
  };
}
