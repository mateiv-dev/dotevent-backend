import mongoose, { Schema } from "mongoose";

export interface FavoriteEventDocument extends Document {
  user: string;
  event: mongoose.Types.ObjectId;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteEventSchema: Schema = new Schema(
  {
    user: {
      type: String,
      required: true,
    },
    event: { 
      type: Schema.Types.ObjectId, 
      ref: 'Event', 
      required: true 
    },
    reminderSent: { 
      type: Boolean, 
      default: false
    }
  },
  {
    timestamps: true
  }
);

FavoriteEventSchema.index({ user: 1, event: 1 }, { unique: true });

export const FavoriteEventModel = mongoose.model<FavoriteEventDocument>('FavoriteEvent', FavoriteEventSchema);
