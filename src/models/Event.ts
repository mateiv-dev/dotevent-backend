import {
  ResponseEventAuthorDto,
  ResponseEventProccessedByDto,
} from '@dtos/EventDto';
import mongoose, { HydratedDocument, InferSchemaType, Schema } from 'mongoose';
import { EventCategory } from 'types/EventCategory';
import { EventStatus } from 'types/EventStatus';
import { FileType } from 'types/FileType';

const AttachmentSchema = new Schema({
  url: {
    type: String,
    trim: true,
    required: true,
  },
  name: {
    type: String,
    trim: true,
    required: true,
  },
  fileType: {
    type: String,
    enum: Object.values(FileType),
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const EventSchema = new Schema(
  {
    author: {
      type: String,
      ref: 'User',
      required: true,
    },

    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: Object.values(EventCategory),
      required: true,
    },
    attendees: { type: Number, required: true, default: 0, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.PENDING,
    },
    organizer: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    faculty: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },

    titleImage: {
      type: String,
      default: null,
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },

    averageRating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },

    proccessedBy: {
      type: String,
      ref: 'User',
    },
    proccessedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

EventSchema.index({ status: 1, createdAt: -1, _id: -1 });

export type Event = InferSchemaType<typeof EventSchema>;
export type EventDocument = HydratedDocument<Event>;

export type PopulatedEventDocument = EventDocument & {
  author: ResponseEventAuthorDto;
  proccessedBy?: ResponseEventProccessedByDto;
};

export type Attachment = InferSchemaType<typeof AttachmentSchema>;
export type AttachmentDocument = HydratedDocument<Attachment>;

export const EventModel = mongoose.model<EventDocument>('Event', EventSchema);
