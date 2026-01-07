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
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
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

export const NotificationModel = mongoose.model<NotificationDocument>(
  'Notification',
  NotificationSchema,
);
