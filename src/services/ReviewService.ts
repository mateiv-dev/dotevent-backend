import { CreateReviewDto } from '@dtos/ReviewDto';
import { PopulatedReviewDocument, ReviewModel } from '@models/Review';
import { AppError } from '@utils/AppError';
import EventRegistrationService from './EventRegistrationService';
import EventService from './EventService';
import UserService from './UserService';

const REVIEW_POPULATE_OPTIONS = [{ path: 'user', select: '-_id name' }];

class ReviewService {
  async getUserReviews(userId: string): Promise<PopulatedReviewDocument[]> {
    const reviews = await ReviewModel.find({ user: userId })
      .populate(REVIEW_POPULATE_OPTIONS)
      .sort('-createdAt')
      .lean()
      .exec();

    return reviews as unknown as PopulatedReviewDocument[];
  }

  async addReview(
    userId: string,
    eventId: string,
    reviewData: CreateReviewDto,
  ): Promise<PopulatedReviewDocument> {
    if (!reviewData) {
      throw new AppError('Invalid review data', 400);
    }

    const user = await UserService.getUser(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const event = await EventService.getPopulatedEvent(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const registration = await EventRegistrationService.getRegistration(
      userId,
      eventId,
    );

    const alreadyReviewed = await ReviewModel.findOne({
      user: userId,
      event: eventId,
    });

    if (alreadyReviewed) {
      throw new AppError('You have already reviewed this event', 409);
    }

    if (!registration) {
      throw new AppError('The user has not registered for this event', 404);
    }

    const eventStartTime = new Date(event.date);
    const now = new Date();
    const gracePeriodMs = 120 * 60 * 1000;

    if (now.getTime() < eventStartTime.getTime() - gracePeriodMs) {
      throw new AppError(
        'You cannot leave a review until the event has started.',
        409,
      );
    }

    const review = new ReviewModel({
      user: userId,
      event: eventId,
      rating: reviewData.rating,
      comment: reviewData.comment?.trim() || undefined,
    });

    await review.save();

    await review.populate('user', '-_id name');

    await EventService.updateRating(eventId);

    return review as unknown as PopulatedReviewDocument;
  }

  async getEventReviews(eventId: string): Promise<PopulatedReviewDocument[]> {
    const reviews = await ReviewModel.find({ event: eventId })
      .populate(REVIEW_POPULATE_OPTIONS)
      .sort('-createdAt')
      .lean()
      .exec();

    return reviews as unknown as PopulatedReviewDocument[];
  }

  async deleteReview(userId: string, reviewId: string): Promise<void> {
    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    if (!reviewId) {
      throw new AppError('Review ID is required', 400);
    }

    const review = await ReviewModel.findById(reviewId);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    const user = await UserService.getUser(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (userId !== review.user) {
      throw new AppError(
        'You do not have permission to delete foreign review',
        403,
      );
    }

    await ReviewModel.findByIdAndDelete(reviewId);

    const eventId = review.event.toString();
    const event = await EventService.getPopulatedEvent(eventId);

    if (event) {
      await EventService.updateRating(eventId);
    }
  }
}

export default new ReviewService();
