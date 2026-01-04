import { EventDocument } from '@models/Event';
import { EventCategory } from 'types/EventCategory';
import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().trim().min(3, 'Title is required.'),
  date: z.coerce.date(),
  time: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format.'),
  location: z.string().trim().min(1, 'Location is required.'),
  category: z.enum(Object.values(EventCategory) as [string, ...string[]]),
  attendees: z.number().min(0).default(0),
  capacity: z.number().min(1),
  isRegistered: z.boolean().default(false),
  organizer: z.string().trim().min(1, 'Organizer is required.'),
  description: z.string().trim().min(1, 'Description is required.'),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventDto = z.infer<typeof createEventSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;

export interface AttachmentDto {
  url: string;
  name: string;
  fileType: string;
}

export class ResponseEventDto {
  public id: string;
  public title: string;
  public date: Date;
  public time: string;
  public location: string;
  public category: EventCategory;
  public attendees: number;
  public capacity: number;
  public organizer: string;
  public description: string;
  public attachments: AttachmentDto[];
  public createdAt: Date;

  constructor(event: EventDocument) {
    this.id = event._id.toString();
    this.title = event.title;
    this.date = event.date;
    this.time = event.time;
    this.location = event.location;
    this.category = event.category;
    this.attendees = event.attendees;
    this.capacity = event.capacity;
    this.organizer = event.organizer;
    this.description = event.description;
    this.attachments = event.attachments;
    this.createdAt = event.createdAt;
  }

  static from(event: EventDocument): ResponseEventDto | null {
    if (!event) {
      return null;
    }

    return new ResponseEventDto(event);
  }

  static fromArray(events: EventDocument[]): ResponseEventDto[] {
    if (!events) {
      return [];
    }

    return events.map((event) => new ResponseEventDto(event));
  }
}
