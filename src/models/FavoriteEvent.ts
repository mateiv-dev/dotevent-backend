import mongoose, { HydratedDocument, InferSchemaType, Schema } from 'mongoose';

const FavoriteEventSchema: Schema = new Schema(
  {
    user: {
      type: String,
      ref: 'User',
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

FavoriteEventSchema.index({ user: 1, event: 1 }, { unique: true });

export type FovoriteEvent = InferSchemaType<typeof FavoriteEventSchema>;
export type FavoriteEventDocument = HydratedDocument<FovoriteEvent>;

export const FavoriteEventModel = mongoose.model<FavoriteEventDocument>(
  'FavoriteEvent',
  FavoriteEventSchema,
);
