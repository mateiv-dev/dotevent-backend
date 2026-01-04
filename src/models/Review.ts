import { ReviewUserDto } from '@dtos/UserDto';
import mongoose, { Document, Schema } from 'mongoose';

export interface ReviewDocument extends Document {
  id: string;
  user: mongoose.Types.ObjectId | ReviewUserDto;
  event: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface PopulatedReviewDocument extends Omit<ReviewDocument, 'user'> {
  user: ReviewUserDto;
}

const ReviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

ReviewSchema.index({ user: 1, event: 1 }, { unique: true });

export const ReviewModel = mongoose.model<ReviewDocument>(
  'Review',
  ReviewSchema,
);
