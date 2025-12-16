import mongoose, { InferSchemaType, Schema, HydratedDocument } from 'mongoose';
import { EventCategory } from 'types/EventCategory';
import { EventStatus } from 'types/EventStatus';

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: Object.values(EventCategory),
    },
    attendees: { type: Number, required: true, default: 0, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      trim: true,
      enum: Object.values(EventStatus),
      default: EventStatus.PENDING
    },
    organizer: { type: String, required: true, trim: true },
    faculty: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    description: { type: String, required: true, trim: true },
    rejectionReason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
  }
);

export const EventModel = mongoose.model<EventDocument>('Event', eventSchema);

export type Event = InferSchemaType<typeof eventSchema>;
export type EventDocument = HydratedDocument<Event>;
