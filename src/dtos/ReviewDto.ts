import { PopulatedReviewDocument } from '@models/Review';
import z from 'zod';
import { ReviewUserDto } from './UserDto';

export const createReviewSchema = z.object({
  rating: z
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot be higher than 5'),
  comment: z
    .string()
    .trim()
    .max(500, 'Comment is too long (max 500 chars)')
    .nullish(),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;

export class ResponseReviewDto {
  public id: string;
  public user: ReviewUserDto;
  public eventId: string;
  public rating: number;
  public comment?: string;
  public createdAt: Date;

  constructor(reviewDocument: PopulatedReviewDocument) {
    this.id = reviewDocument._id.toString();

    this.user = {
      name: reviewDocument.user.name,
    };

    this.eventId = reviewDocument.event.toString();
    this.rating = reviewDocument.rating;

    if (reviewDocument.comment) {
      this.comment = reviewDocument.comment;
    }

    this.createdAt = reviewDocument.createdAt;
  }

  static from(
    reviewDocument: PopulatedReviewDocument,
  ): ResponseReviewDto | null {
    if (!reviewDocument) return null;

    return new ResponseReviewDto(reviewDocument);
  }

  static fromArray(
    reviewDocuments: PopulatedReviewDocument[],
  ): ResponseReviewDto[] | null {
    if (!reviewDocuments) return null;

    return reviewDocuments.map((review) => new ResponseReviewDto(review));
  }
}
