import { EventDocument } from '@models/Event';
import { NotificationDocument as PopulatedNotificationDocument } from '@models/Notification';
import { RoleRequestDocument } from '@models/RoleRequest';
import { ObjectId } from 'mongoose';

export interface ResponseNotificationRelevatedEventDto {
  id: string;
  title: string;
}

export interface ResponseNotificationRelevatedRequestDto {
  id: string;
  requestedRole: string;
}

export class ResponseNotificationDto {
  public id: string;
  public title: string;
  // public message: string;
  public type: string;
  public isRead: boolean;
  public relatedEvent: ResponseNotificationRelevatedEventDto | null;
  public relatedRequest: ResponseNotificationRelevatedRequestDto | null;
  public createdAt: Date;

  constructor(notification: PopulatedNotificationDocument) {
    this.id = (notification._id as ObjectId).toString();
    this.title = notification.title as string;
    // this.message = notification.message as string;
    this.type = notification.type as string;
    this.isRead = notification.isRead as boolean;
    this.createdAt = notification.createdAt as Date;

    if (notification.relatedEvent) {
      const eventData: ResponseNotificationRelevatedEventDto = {
        id: (
          notification.relatedEvent as Partial<EventDocument>
        )._id!.toString(),
        title: (
          notification.relatedEvent as Partial<EventDocument>
        ).title!.toString(),
      };

      this.relatedEvent = eventData;
      this.relatedRequest = null;
    } else {
      this.relatedEvent = null;
    }

    if (notification.relatedRequest) {
      const requestData: ResponseNotificationRelevatedRequestDto = {
        id: (
          notification.relatedRequest as Partial<RoleRequestDocument>
        )._id!.toString(),
        requestedRole: (
          notification.relatedRequest as Partial<RoleRequestDocument>
        ).requestedRole!.toString(),
      };

      this.relatedRequest = requestData;
      this.relatedEvent = null;
    } else {
      this.relatedRequest = null;
    }
  }

  static from(
    registration: PopulatedNotificationDocument,
  ): ResponseNotificationDto | null {
    if (!registration) {
      return null;
    }

    return new ResponseNotificationDto(registration);
  }

  static fromArray(
    registrations: PopulatedNotificationDocument[],
  ): ResponseNotificationDto[] | null {
    if (!registrations) {
      return null;
    }

    return registrations.map((reg) => new ResponseNotificationDto(reg));
  }
}
