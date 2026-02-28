import { Router } from "express";

export const eventsRouter = Router();

eventsRouter.get("/", async (_req, res) => {
  res.json([{ id: "e1", title: "Demo Event" }]);
});