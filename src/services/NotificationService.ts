import { FavoriteEventModel } from '@models/FavoriteEvent';
import {
  NotificationModel,
  PopulatedNotificationDocument,
} from '@models/Notification';
import { RegistrationModel } from '@models/Registration';
import { AppError } from '@utils/AppError';
import { INotification } from 'types/INotification';
import { NotificationType } from 'types/NotificationType';
import EventService from './EventService';

const NOTIFICATION_POPULATE_OPTIONS = [
  { path: 'relatedEvent', select: '_id title' },
  { path: 'relatedRequest', select: '_id requestedRole' },
];

class NotificationService {
  async createNotification(
    notificationData: INotification,
  ): Promise<PopulatedNotificationDocument> {
    const notification = new NotificationModel(notificationData);

    await notification.save();

    const populated = await notification.populate(
      NOTIFICATION_POPULATE_OPTIONS,
    );

    return populated as unknown as PopulatedNotificationDocument;
  }

  async getUserNotifications(
    userId: string,
    limit: number = 50,
  ): Promise<PopulatedNotificationDocument[]> {
    const notifications = await NotificationModel.find({ user: userId })
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate(NOTIFICATION_POPULATE_OPTIONS)
      .lean()
      .exec();

    return notifications as unknown as PopulatedNotificationDocument[];
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<PopulatedNotificationDocument> {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true },
    )
      .populate(NOTIFICATION_POPULATE_OPTIONS)
      .lean()
      .exec();

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return notification as unknown as PopulatedNotificationDocument;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await NotificationModel.updateMany(
      { user: userId, isRead: false },
      { isRead: true },
    );

    return result.modifiedCount;
  }

  async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    const notification = await NotificationModel.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await NotificationModel.countDocuments({
      user: userId,
      isRead: false,
    });
  }

  async createEventUpdatedNotifications(eventId: string): Promise<void> {
    const event = await EventService.getEvent(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const registrations = await RegistrationModel.find({ event: eventId })
      .populate('user', 'preferences')
      .lean()
      .exec();

    const favorites = await FavoriteEventModel.find({ event: eventId })
      .populate('user', 'preferences')
      .lean()
      .exec();

    const registeredUserIds = new Set(
      registrations.map((reg) => (reg.user as any)?._id?.toString()),
    );

    const notifications: Promise<any>[] = [];

    registrations.forEach((reg) => {
      const user = reg.user as any;
      if (!user) return;

      const wantsNotification =
        user.preferences?.notifications?.eventUpdates ?? true;

      if (wantsNotification) {
        const notification: INotification = {
          user: user._id.toString(),
          relatedEvent: eventId,
          title: event.title,
          type: NotificationType.REGISTERED_EVENT_UPDATED,
        };

        notifications.push(this.createNotification(notification));
      }
    });

    favorites.forEach((fav) => {
      const user = fav.user as any;
      if (!user) return;

      const userId = user._id.toString();

      if (!registeredUserIds.has(userId)) {
        const wantsNotification =
          user.preferences?.notifications?.eventUpdates ?? true;

        if (wantsNotification) {
          const notification: INotification = {
            user: userId,
            relatedEvent: eventId,
            title: event.title,
            type: NotificationType.FAVORITE_EVENT_UPDATED,
          };

          notifications.push(this.createNotification(notification));
        }
      }
    });

    await Promise.all(notifications);
  }
}

export default new NotificationService();
