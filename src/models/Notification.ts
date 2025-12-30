import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType } from 'types/NotificationType';

export interface NotificationDocument extends Document {
  user: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedEvent?: mongoose.Types.ObjectId;
  relatedRequest?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  user: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(NotificationType)
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedEvent: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: false
  },
  relatedRequest: {
    type: Schema.Types.ObjectId,
    ref: 'RoleRequest',
    required: false
  }
},
  {
    timestamps: true
  }
);

NotificationSchema.index({ user: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<NotificationDocument>('Notification', NotificationSchema);
