import { z } from "zod";

const baseEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDateTime: z.coerce.date(),
  endDateTime: z.coerce.date(),
  locationType: z.enum(["physical", "online"]).optional(),
  location: z.string().optional(),
  status: z.enum(["draft", "published", "completed", "cancelled"]).optional(),
  imageBase64: z.string().optional(),
});

export const createEventSchema = baseEventSchema.strict();

export const updateEventSchema = baseEventSchema.partial().strict();

export const selectVendorsSchema = z
  .object({
    currency: z.string().optional(),
    vendors: z
      .array(
        z.object({
          vendorId: z.string().min(1),
          serviceId: z.string().min(1),
          price: z.number().positive(),
          category: z.string().optional(),
          vendorNameSnapshot: z.string().optional(),
          serviceNameSnapshot: z.string().optional(),
        })
      )
      .min(1),
  })
  .strict();

