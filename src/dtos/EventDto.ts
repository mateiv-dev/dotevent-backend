import { EventDocument } from '@models/Event';
import { EventCategory } from 'types/EventCategory';
import { FileType } from 'types/FileType';
import {
  CreateEventSchema,
  UpdateEventSchema,
} from 'validators/inputEventDataValidator';
import { z } from 'zod';

export type CreateEventDto = z.infer<typeof CreateEventSchema>;
export type UpdateEventDto = z.infer<typeof UpdateEventSchema>;

export interface CreateAttachmentDto {
  url: string;
  name: string;
  fileType: FileType;
  size: number;
}

export interface ResponseAttachmentDto extends CreateAttachmentDto {
  id: string;
  uploadedAt: Date;
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
  public attachments: ResponseAttachmentDto[];
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
    this.createdAt = event.createdAt;

    this.attachments = event.attachments.map((attachment) => ({
      id: attachment._id.toString(),
      url: attachment.url,
      name: attachment.name,
      fileType: attachment.fileType,
      size: attachment.size,
      uploadedAt: attachment.uploadedAt,
    }));
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
