import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEventById,
  getMyEvents,
  listPublishedEvents,
  selectVendors,
  updateEvent,
} from "../../api/controllers/event.controller";
import { requireAuth, requireRole } from "../../api/middlewares/auth";
import { validateBody } from "../../api/middlewares/validate";
import {
  createEventSchema,
  updateEventSchema,
  selectVendorsSchema,
} from "../../api/validation/event.validation";

export const eventsRouter = Router();

// Organizer-only routes
eventsRouter.post(
  "/",
  requireAuth,
  requireRole("organizer"),
  validateBody(createEventSchema),
  createEvent
);

eventsRouter.get(
  "/my",
  requireAuth,
  requireRole("organizer"),
  getMyEvents
);

eventsRouter.put(
  "/:id",
  requireAuth,
  requireRole("organizer"),
  validateBody(updateEventSchema),
  updateEvent
);

eventsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("organizer"),
  deleteEvent
);

eventsRouter.post(
  "/:id/vendors/select",
  requireAuth,
  requireRole("organizer"),
  validateBody(selectVendorsSchema),
  selectVendors
);

// Public routes
eventsRouter.get("/", listPublishedEvents);
eventsRouter.get("/:id", getEventById);

