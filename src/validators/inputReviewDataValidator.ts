import z from 'zod';

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
