import type { Request, Response, NextFunction } from "express";
import { Event } from "../../models/event.model";

/** Roles that can create and manage events (PLANNER = app role, organizer = legacy) */
const EVENT_CREATOR_ROLES = ["PLANNER", "organizer"];

function canManageEvents(role: string): boolean {
  return EVENT_CREATOR_ROLES.includes(role);
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !canManageEvents(req.user.role)) {
      const error = new Error("Only planners can create events");
      // @ts-expect-error augment
      error.statusCode = 403;
      throw error;
    }

    const organizerId = req.user.id;

    const event = await Event.create({
      organizerId,
      ...req.body,
      status: "draft",
    });

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyEvents(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !canManageEvents(req.user.role)) {
      const error = new Error("Only planners can view their events");
      // @ts-expect-error augment
      error.statusCode = 403;
      throw error;
    }

    const organizerId = req.user.id;
    const events = await Event.find({ organizerId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: events,
    });
  } catch (err) {
    next(err);
  }
}

export async function listPublishedEvents(_req: Request, res: Response, next: NextFunction) {
  try {
    const events = await Event.find({ status: "published" }).sort({ startDateTime: 1 });

    res.json({
      success: true,
      data: events,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEventById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      const error = new Error("Event not found");
      // @ts-expect-error augment
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !canManageEvents(req.user.role)) {
      const error = new Error("Only planners can update events");
      // @ts-expect-error augment
      error.statusCode = 403;
      throw error;
    }

    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      const error = new Error("Event not found");
      // @ts-expect-error augment
      error.statusCode = 404;
      throw error;
    }

    if (event.organizerId !== req.user.id) {
      const error = new Error("You do not own this event");
      // @ts-expect-error augment
      error.statusCode = 403;
      throw error;
    }

    Object.assign(event, req.body);
    await event.save();

    res.json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !canManageEvents(req.user.role)) {
      const error = new Error("Only planners can delete events");
      // @ts-expect-error augment
      error.statusCode = 403;
      throw error;
    }

    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      const error = new Error("Event not found");
      // @ts-expect-error augment
      error.statusCode = 404;
      throw error;
    }

    if (event.organizerId !== req.user.id) {
      const error = new Error("You do not own this event");
      // @ts-expect-error augment
      error.statusCode = 403;
      throw error;
    }

    await event.deleteOne();

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function selectVendors(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !canManageEvents(req.user.role)) {
      const error = new Error("Only planners can select vendors");
      // @ts-expect-error augment
      error.statusCode = 403;
      throw error;
    }

    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      const error = new Error("Event not found");
      // @ts-expect-error augment
      error.statusCode = 404;
      throw error;
    }

    if (event.organizerId !== req.user.id) {
      const error = new Error("You do not own this event");
      // @ts-expect-error augment
      error.statusCode = 403;
      throw error;
    }

    const { vendors, currency } = req.body as {
      vendors: { vendorId: string; serviceId: string; price: number; vendorNameSnapshot?: string; serviceNameSnapshot?: string }[];
      currency?: string;
    };

    const subtotal = vendors.reduce((sum, v) => sum + v.price, 0);
    const platformFee = Number((subtotal * 0.05).toFixed(2));
    const total = Number((subtotal + platformFee).toFixed(2));

    event.selectedVendors = vendors;
    event.budget = {
      subtotal,
      platformFee,
      total,
      currency: currency || event.budget?.currency || "USD",
    };

    await event.save();

    res.json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllEventsForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await Event.find({}).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err) {
    next(err);
  }
}
