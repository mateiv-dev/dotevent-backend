import { NotificationDocument } from '@models/Notification';

export class ResponseNotificationDto {
  public id: string;
  public title: string;
  public message: string;
  public type: string;
  public isRead: boolean;
  public relatedEvent: string | null;
  public relatedRequest: string | null;
  public createdAt: Date;

  constructor(notification: NotificationDocument) {
    this.id = (notification._id as any).toString();
    this.title = notification.title as string;
    this.message = notification.message as string;
    this.type = notification.type as string;
    this.isRead = notification.isRead as boolean;
    this.createdAt = notification.createdAt as Date;

    this.relatedEvent = notification.relatedEvent
      ? notification.relatedEvent.toString()
      : null;

    this.relatedRequest = notification.relatedRequest
      ? notification.relatedRequest.toString()
      : null;
  }

  static from(
    registration: NotificationDocument,
  ): ResponseNotificationDto | null {
    if (!registration) {
      return null;
    }

    return new ResponseNotificationDto(registration);
  }

  static fromArray(
    registrations: NotificationDocument[],
  ): ResponseNotificationDto[] | null {
    if (!registrations) {
      return null;
    }

    return registrations.map((reg) => new ResponseNotificationDto(reg));
  }
}
