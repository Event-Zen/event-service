import type { Request, Response, NextFunction } from "express";
import { verifyJwtFromRequest } from "../../config/jwt";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    verifyJwtFromRequest(req);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        verifyJwtFromRequest(req);
      }

      if (!req.user || !roles.includes(req.user.role)) {
        const error = new Error("Forbidden");
        // @ts-expect-error augment
        error.statusCode = 403;
        throw error;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

