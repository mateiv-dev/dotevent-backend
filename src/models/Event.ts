import mongoose, { InferSchemaType, Schema, HydratedDocument } from 'mongoose';
import { EventCategory } from 'types/EventCategory';

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
    isRegistered: { type: Boolean, required: true, default: false },
    organizer: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

export const EventModel = mongoose.model<EventDocument>('Event', eventSchema);

export type Event = InferSchemaType<typeof eventSchema>;
export type EventDocument = HydratedDocument<Event>;
