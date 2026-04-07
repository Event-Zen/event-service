import { Schema, model, type Document } from "mongoose";

export type LocationType = "physical" | "online";
export type EventStatus = "draft" | "published" | "completed" | "cancelled";

export interface SelectedVendor {
  vendorId: string;
  serviceId: string;
  price: number;
  category?: string;
  vendorNameSnapshot?: string;
  serviceNameSnapshot?: string;
}

export interface Budget {
  subtotal: number;
  platformFee: number;
  total: number;
  currency: string;
}

export interface EventDocument extends Document {
  organizerId: string;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  locationType: LocationType;
  location?: string;
  status: EventStatus;
  selectedVendors: SelectedVendor[];
  budget?: Budget;
  createdAt: Date;
  updatedAt: Date;
}

const SelectedVendorSchema = new Schema<SelectedVendor>(
  {
    vendorId: { type: String, required: true },
    serviceId: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String },
    vendorNameSnapshot: { type: String },
    serviceNameSnapshot: { type: String },
  },
  { _id: false }
);

const BudgetSchema = new Schema<Budget>(
  {
    subtotal: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, required: true },
  },
  { _id: false }
);

const EventSchema = new Schema<EventDocument>(
  {
    organizerId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    locationType: {
      type: String,
      enum: ["physical", "online"],
      default: "physical",
    },
    location: { type: String },
    status: {
      type: String,
      enum: ["draft", "published", "completed", "cancelled"],
      default: "draft",
      index: true,
    },
    selectedVendors: {
      type: [SelectedVendorSchema],
      default: [],
    },
    budget: {
      type: BudgetSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Event = model<EventDocument>("Event", EventSchema);

