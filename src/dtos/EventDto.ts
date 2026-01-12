import { PopulatedEventDocument } from '@models/Event';
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

export interface ResponseEventAuthorDto {
  name: string;
  email: string;
  role: string;
}

export interface ResponseEventUpdatedByDto {
  name: string;
  email: string;
}

export interface ResponseEventProccessedByDto {
  name: string;
  email: string;
}

export interface ResponseOrganizerDto {
  represents: string | null;
  organizationName: string | null;
}

export class ResponseEventDto {
  public id: string;
  public author: ResponseEventAuthorDto | null;
  public status: string;
  public title: string;
  public date: Date;
  public time: string;
  public location: string;
  public category: EventCategory;
  public attendees: number;
  public capacity: number;
  public organizer: ResponseOrganizerDto;
  public description: string;
  public attachments: ResponseAttachmentDto[];
  public createdAt: Date;

  public faculty: string | null;
  public department: string | null;
  public titleImage: string | null;
  public averageRating: number;
  public reviewCount: number;
  public proccessedBy: ResponseEventProccessedByDto | null;
  public proccessedAt: Date | null;
  public rejectionReason: string | null;

  public updatedBy: ResponseEventUpdatedByDto | null;
  public updatedAt: Date;

  constructor(event: PopulatedEventDocument) {
    let authorData: ResponseEventAuthorDto | null = null;

    if (event.author) {
      authorData = {
        name: event.author.name,
        email: event.author.email,
        role: event.author.role,
      };
    }

    this.id = event._id.toString();
    this.status = event.status;
    this.author = authorData;
    this.title = event.title;
    this.date = event.date;
    this.time = event.time;
    this.location = event.location;
    this.category = event.category;
    this.attendees = event.attendees;
    this.capacity = event.capacity;

    const organizerData: ResponseOrganizerDto = {
      represents: event.organizer.represents ?? null,
      organizationName: event.organizer.organizationName ?? null,
    };

    this.organizer = organizerData;
    this.description = event.description;
    this.createdAt = event.createdAt;

    this.attachments =
      (event.attachments ?? []).map((attachment) => ({
        id: attachment._id.toString(),
        url: attachment.url,
        name: attachment.name,
        fileType: attachment.fileType,
        size: attachment.size,
        uploadedAt: attachment.uploadedAt,
      })) ?? [];

    if (event.titleImage) {
      this.attachments = this.attachments.filter(
        (a) => a.url !== event.titleImage,
      );
    }

    this.averageRating = event.averageRating;
    this.reviewCount = event.reviewCount;
    this.titleImage = event.titleImage ?? null;

    this.rejectionReason = event.rejectionReason ?? null;

    if (event.proccessedBy) {
      this.proccessedBy = {
        name: event.proccessedBy.name,
        email: event.proccessedBy.email,
      };
    } else {
      this.proccessedBy = null;
    }

    this.proccessedAt = event.proccessedAt ?? null;

    this.faculty = event.faculty ?? null;
    this.department = event.department ?? null;

    if (event.updatedBy) {
      const updatedByData: ResponseEventUpdatedByDto = {
        name: event.updatedBy.name,
        email: event.updatedBy.email,
      };

      this.updatedBy = updatedByData;
    } else {
      this.updatedBy = null;
    }

    this.updatedAt = event.updatedAt;
  }

  static from(event: PopulatedEventDocument): ResponseEventDto | null {
    if (!event) {
      return null;
    }

    return new ResponseEventDto(event);
  }

  static fromArray(events: PopulatedEventDocument[]): ResponseEventDto[] {
    if (!events) {
      return [];
    }

    return events.map((event) => new ResponseEventDto(event));
  }
}
