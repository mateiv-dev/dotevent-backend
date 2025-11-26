import mongoose, { Schema } from 'mongoose';
import { EventDocument } from '../models/event';
import { EventCategory } from '../models/event_category';

const EventSchema = new Schema<EventDocument>(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      // enum: ['Academic', 'Social', 'Career', 'Sports'],
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

export default mongoose.model<EventDocument>('Event', EventSchema);
