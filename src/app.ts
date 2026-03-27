import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import {
  createEvent,
  deleteEvent,
  getEventById,
  getMyEvents,
  listPublishedEvents,
  selectVendors,
  updateEvent,
  getAllEventsForAdmin,
} from "./api/controllers/event.controller";
import { errorHandler } from "./api/middlewares/errorHandler";
import { requireAuth, requireRole } from "./api/middlewares/auth";
import { validateBody } from "./api/middlewares/validate";
import {
  createEventSchema,
  updateEventSchema,
  selectVendorsSchema,
} from "./api/validation/event.validation";
import { healthRouter } from "./api/routes/health.routes";
import { verifyTokenOrNull } from "./config/jwt";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.use("/health", healthRouter);

  // Debug: check token (path outside /api/events so it never matches :id)
  app.get("/api/check-token", (req, res) => {
    const result = verifyTokenOrNull(req.headers.authorization);
    res.json({ success: result.ok, ...(result.ok ? { payload: result.payload } : { error: result.error }) });
  });

  // Event routes — PLANNER (and organizer) can create/manage events
  app.get("/api/events", listPublishedEvents);
  app.get("/api/events/my", requireAuth, requireRole("organizer", "PLANNER"), getMyEvents);
  app.get("/api/events/:id", getEventById);
  app.post(
    "/api/events",
    requireAuth,
    requireRole("organizer", "PLANNER"),
    validateBody(createEventSchema),
    createEvent
  );
  app.put(
    "/api/events/:id",
    requireAuth,
    requireRole("organizer", "PLANNER"),
    validateBody(updateEventSchema),
    updateEvent
  );
  app.delete(
    "/api/events/:id",
    requireAuth,
    requireRole("organizer", "PLANNER"),
    deleteEvent
  );
  app.post(
    "/api/events/:id/vendors/select",
    requireAuth,
    requireRole("organizer", "PLANNER"),
    validateBody(selectVendorsSchema),
    selectVendors
  );

  // Admin monitoring endpoints
  app.get("/api/events/admin", requireAuth, requireRole("admin", "ADMIN"), getAllEventsForAdmin);

  // 404 — must be after all routes
  app.use((_req, _res, next) => {
    const err = new Error("Not Found");
    (err as any).statusCode = 404;
    next(err);
  });

  app.use(errorHandler);

  return app;
}
