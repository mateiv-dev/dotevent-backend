import { FavoriteEventModel } from '@models/FavoriteEvent';
import {
  NotificationModel,
  PopulatedNotificationDocument,
} from '@models/Notification';
import { RegistrationModel } from '@models/Registration';
import { AppError } from '@utils/AppError';
import { INotification } from 'types/INotification';
import { NotificationType } from 'types/NotificationType';

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

  private async notifyEventSubscribers(
    eventId: string,
    eventTitle: string,
    types: {
      registered: NotificationType;
      favorite: NotificationType;
    },
  ): Promise<void> {
    const [registrations, favorites] = await Promise.all([
      RegistrationModel.find({ event: eventId })
        .populate('user', 'preferences')
        .lean()
        .exec(),
      FavoriteEventModel.find({ event: eventId })
        .populate('user', 'preferences')
        .lean()
        .exec(),
    ]);

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
        notifications.push(
          this.createNotification({
            user: user._id.toString(),
            relatedEvent: eventId,
            title: eventTitle,
            type: types.registered,
          }),
        );
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
          notifications.push(
            this.createNotification({
              user: userId,
              relatedEvent: eventId,
              title: eventTitle,
              type: types.favorite,
            }),
          );
        }
      }
    });

    await Promise.all(notifications);
  }

  async createEventUpdatedNotifications(
    eventId: string,
    eventTitle: string,
  ): Promise<void> {
    await this.notifyEventSubscribers(eventId, eventTitle, {
      registered: NotificationType.REGISTERED_EVENT_UPDATED,
      favorite: NotificationType.FAVORITE_EVENT_UPDATED,
    });
  }

  async createEventDeletedNotifications(
    eventId: string,
    eventTitle: string,
  ): Promise<void> {
    await this.notifyEventSubscribers(eventId, eventTitle, {
      registered: NotificationType.EVENT_DELETED,
      favorite: NotificationType.EVENT_DELETED,
    });
  }
}

export default new NotificationService();
