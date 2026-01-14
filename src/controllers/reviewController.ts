import { CreateReviewDto, ResponseReviewDto } from '@dtos/ReviewDto';
import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import ReviewService from '@services/ReviewService';
import { AppError } from '@utils/AppError';
import { Request, Response } from 'express';

export const addReview = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const { eventId } = req.params;

    const reviewData: CreateReviewDto = req.body;

    if (!eventId) {
      throw new AppError('Event ID is required', 400);
    }

    const review = await ReviewService.addReview(userId, eventId, reviewData);

    res.status(201).json(ResponseReviewDto.from(review));
  },
);

export const getEventReviews = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { eventId } = req.params;

    if (!eventId) {
      throw new AppError('Event ID is required', 400);
    }

    const reviews = await ReviewService.getEventReviews(eventId);

    res.status(200).json(ResponseReviewDto.fromArray(reviews));
  },
);

export const deleteReview = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const { reviewId } = req.params;

    if (!reviewId) {
      throw new AppError('Review ID is required', 400);
    }

    await ReviewService.deleteReview(userId, reviewId);

    res.status(200).send();
  },
);
