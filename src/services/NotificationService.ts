import { NotificationDocument, NotificationModel } from '@models/Notification';
import { AppError } from '@utils/AppError';
import { INotification } from 'types/INotification';

class NotificationService {
  async createNotification(
    notificationData: INotification,
  ): Promise<NotificationDocument> {
    const notification = new NotificationModel(notificationData);
    await notification.save();
    return notification;
  }

  async getUserNotifications(
    userId: string,
    limit: number = 50,
  ): Promise<NotificationDocument[]> {
    const notifications = await NotificationModel.find({ user: userId })
      .limit(limit)
      // .populate('relatedEvent')
      // .populate('relatedRequest')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return notifications;
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationDocument> {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true },
    )
      .lean()
      .exec();

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return notification;
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
}

export default new NotificationService();
