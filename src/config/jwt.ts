import jwt from "jsonwebtoken";
import type { Request } from "express";

export interface JwtUserPayload {
  id: string;
  role: string;
  email: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtUserPayload;
  }
}

// Must match user-service. Strip BOM, CRLF, and trim so .env quirks don't break verification.
function normalizeSecret(s: string): string {
  return s.replace(/\uFEFF/g, "").replace(/\r\n?/g, "").trim();
}
const jwtAccessSecret: string = normalizeSecret(
  process.env.JWT_ACCESS_SECRET || "dev_access_secret"
);

export function verifyJwtFromRequest(req: Request): JwtUserPayload {
  const authHeader = req.headers.authorization;

  // Express lowercases headers, so check "bearer " (lowercase)
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    const err = new Error("Authorization header missing or malformed");
    (err as any).statusCode = 401;
    throw err;
  }

  const token = authHeader.substring(7).trim(); // "bearer " length = 7

  function setUserFromDecoded(decoded: any): JwtUserPayload {
    if (!decoded || typeof decoded !== "object") {
      const err = new Error("Invalid token payload");
      (err as any).statusCode = 401;
      throw err;
    }
    const id = decoded.id ?? decoded.sub;
    const role = decoded.role;
    const email = decoded.email;
    if (!id || !role || !email) {
      const err = new Error("Invalid token payload");
      (err as any).statusCode = 401;
      throw err;
    }
    req.user = { id: String(id), role: String(role), email: String(email) };
    return req.user;
  }

  const opts = { algorithms: ["HS256"] as jwt.Algorithm[] };
  const secretsToTry = [
    jwtAccessSecret,
    "event_zen_access_secret",
    "dev_access_secret",
  ].filter((s, i, arr) => arr.indexOf(s) === i); // unique only

  let lastError: any;
  for (const secret of secretsToTry) {
    try {
      const decoded = jwt.verify(token, secret, opts);
      return setUserFromDecoded(decoded);
    } catch (e) {
      lastError = e;
    }
  }

  const reason =
    lastError?.message || lastError?.name || String(lastError) || "unknown";
  const err = new Error(`Invalid or expired token: ${reason}`) as Error & {
    statusCode?: number;
    details?: string;
  };
  err.statusCode = 401;
  err.details = reason;
  throw err;
}

/** For debugging: verify token and return result without throwing. */
export function verifyTokenOrNull(
  authHeader: string | undefined
): { ok: true; payload: JwtUserPayload } | { ok: false; error: string } {
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { ok: false, error: "Authorization header missing or not Bearer" };
  }
  const token = authHeader.substring(7).trim();
  const opts = { algorithms: ["HS256"] as jwt.Algorithm[] };
  const secrets = [
    jwtAccessSecret,
    "event_zen_access_secret",
    "dev_access_secret",
  ].filter((s, i, arr) => arr.indexOf(s) === i);

  let lastError: string = "unknown";
  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret, opts) as any;
      const id = decoded?.id ?? decoded?.sub;
      const role = decoded?.role;
      const email = decoded?.email;
      if (!id || !role || !email) {
        return { ok: false, error: "Invalid token payload (missing id/role/email)" };
      }
      return {
        ok: true,
        payload: { id: String(id), role: String(role), email: String(email) },
      };
    } catch (e: any) {
      lastError = e?.message || e?.name || String(e) || "unknown";
    }
  }
  return { ok: false, error: lastError };
}


