import { EventCategory } from 'types/EventCategory';
import z from 'zod';

export const CreateEventSchema = z.object({
  title: z.string().trim().min(2, 'Title is required.'),
  date: z.coerce.date(),
  time: z
    .string()
    .trim()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM).'),
  location: z.string().trim().min(2, 'Location is required.'),
  category: z.enum(Object.values(EventCategory) as [string, ...string[]]),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1.'),
  // organizer: z.string().trim().min(2, 'Organizer is required.'),
  description: z.string().trim().min(2, 'Description is required.'),
  faculty: z
    .string()
    .trim()
    .nullish()
    .transform((v) => v || undefined),
  department: z
    .string()
    .trim()
    .nullish()
    .transform((v) => v || undefined),
  titleImageName: z
    .string()
    .trim()
    .min(1, 'coverImageName can not be empty.')
    .nullish(),
});

export const UpdateEventSchema = CreateEventSchema.partial().extend({
  deleteAttachments: z.array(z.string()).optional(),
});
// .strict();
