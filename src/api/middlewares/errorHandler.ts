import type { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

  const response: Record<string, unknown> = {
    success: false,
    message: err.message || "Server Error",
  };

  if (err.details) {
    response.details = err.details;
  }

  res.status(status).json(response);
}