import {
  ResponseNotificationRelevatedEventDto,
  ResponseNotificationRelevatedRequestDto,
} from '@dtos/NotificationDto';
import mongoose, { HydratedDocument, InferSchemaType, Schema } from 'mongoose';
import { NotificationType } from 'types/NotificationType';

const NotificationSchema: Schema = new Schema(
  {
    user: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(NotificationType),
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedEvent: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
    relatedRequest: {
      type: Schema.Types.ObjectId,
      ref: 'RoleRequest',
    },
  },
  {
    timestamps: true,
  },
);

NotificationSchema.index({ user: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof NotificationSchema>;
export type NotificationDocument = HydratedDocument<Notification>;

export type PopulatedNotificationDocument = NotificationDocument & {
  relatedEvent?: ResponseNotificationRelevatedEventDto;
  relatedRequest?: ResponseNotificationRelevatedRequestDto;
};

export const NotificationModel = mongoose.model<NotificationDocument>(
  'Notification',
  NotificationSchema,
);
