import { PopulatedReviewDocument } from '@models/Review';
import { createReviewSchema as CreateReviewSchema } from 'validators/inputReviewDataValidator';
import z from 'zod';

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;

export interface ResponseReviewUserDto {
  name: string;
}

export class ResponseReviewDto {
  public id: string;
  public user: ResponseReviewUserDto;
  public eventId: string;
  public rating: number;
  public comment?: string;
  public createdAt: Date;

  constructor(reviewDocument: PopulatedReviewDocument) {
    this.id = reviewDocument._id.toString();

    const userData: ResponseReviewUserDto = {
      name: reviewDocument.user.name,
    };

    this.user = userData;
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
