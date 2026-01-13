import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z
    .string({
      message: 'Name is required.',
    })
    .trim()
    .min(1, 'Name is required.')
    .min(2, 'Name must be at least 2 characters long.')
    .max(30, 'Name cannot exceed 30 characters.'),

  adminKey: z.string().trim().min(1, `adminKey cannot be empty.`).optional(),

  receiveEventUpdatedNotifications: z.boolean().optional(),
  receiveEventReminderNotifications: z.boolean().optional(),
  receiveEventUpdatedEmails: z.boolean().optional(),
  receiveEventRemiderEmails: z.boolean().optional(),
});

export const UpdateUserSchema = CreateUserSchema.omit({ adminKey: true })
  .partial()
  .extend({
    university: z
      .string({
        message: 'University must be a valid text.',
      })
      .trim()
      .min(1, 'University name cannot be empty.')
      .min(2, 'University name must be at least 2 characters long.')
      .optional(),
  });
