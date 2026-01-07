import { ReviewUserDto } from '@dtos/UserDto';
import mongoose, { HydratedDocument, InferSchemaType, Schema } from 'mongoose';

const ReviewSchema = new Schema(
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

export type Review = InferSchemaType<typeof ReviewSchema>;
export type ReviewDocument = HydratedDocument<Review>;

export type PopulatedReviewDocument = Omit<ReviewDocument, 'user'> & {
  user: ReviewUserDto;
};

export const ReviewModel = mongoose.model<ReviewDocument>(
  'Review',
  ReviewSchema,
);
