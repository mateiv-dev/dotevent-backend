import mongoose, { Schema, Document } from 'mongoose';

export interface NotificationDocument extends Document {
  user: string;
  title: string;
  message: string;
  type: 'event_approved' | 'event_rejected' | 'role_approved' | 'role_rejected' | 'event_reminder' | 'event_update';
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
    enum: ['event_approved', 'event_rejected', 'role_approved', 'role_rejected', 'event_reminder', 'event_update']
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
