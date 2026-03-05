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

const accessSecret = process.env.JWT_ACCESS_SECRET;

if (!accessSecret) {
  throw new Error("JWT_ACCESS_SECRET is missing");
}

const jwtAccessSecret: string = accessSecret;

export function verifyJwtFromRequest(req: Request): JwtUserPayload {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Authorization header missing or malformed");
    // @ts-expect-error augment
    err.statusCode = 401;
    throw err;
  }

  const token = authHeader.substring("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(token, jwtAccessSecret);

    if (
      typeof decoded === "string" ||
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.id ||
      !decoded.role ||
      !decoded.email
    ) {
      const err = new Error("Invalid token payload");
      // @ts-expect-error augment
      err.statusCode = 401;
      throw err;
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    return req.user;
  } catch (error) {
    const err = new Error("Invalid or expired token");
    // @ts-expect-error augment
    err.statusCode = 401;
    throw err;
  }
}

