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

const OrganizerSchema = new Schema(
  {
    represents: { type: String, trim: true },
    organizationName: { type: String, trim: true },
    contact: { type: String, trim: true, required: true },
  },
  { _id: false },
);

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
    endDate: { type: Date, required: true },
    endTime: { type: String, required: true, trim: true },

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
    organizer: {
      type: OrganizerSchema,
      required: true,
    },
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

    updatedBy: {
      type: String,
      ref: 'User',
    },

    targetEventId: {
      type: mongoose.Types.ObjectId,
      ref: 'Event',
      default: null,
    },

    pendingDeletedFileUrls: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

EventSchema.index({ date: -1 });

EventSchema.index({ faculty: 1 });
EventSchema.index({ department: 1 });
EventSchema.index({ location: 1 });
EventSchema.index({ eventType: 1 });

EventSchema.index({ 'organizer.represents': 1 });
EventSchema.index({ 'organizer.organizationName': 1 });

type InferredEvent = InferSchemaType<typeof EventSchema>;

export type Event = Omit<InferredEvent, 'titleImage'> & {
  titleImage: string | null;
};

export type EventDocument = HydratedDocument<Event>;

export type PopulatedEventDocument = EventDocument & {
  author: ResponseEventAuthorDto;
  proccessedBy?: ResponseEventProccessedByDto;
  updatedBy?: ResponseEventProccessedByDto;
};

export type Attachment = InferSchemaType<typeof AttachmentSchema>;
export type AttachmentDocument = HydratedDocument<Attachment>;

export const EventModel = mongoose.model<EventDocument>('Event', EventSchema);

export const PendingEventModel = mongoose.model<EventDocument>(
  'PendingEvent',
  EventSchema,
);

export const RejectedEventModel = mongoose.model<EventDocument>(
  'RejectedEvent',
  EventSchema,
);
