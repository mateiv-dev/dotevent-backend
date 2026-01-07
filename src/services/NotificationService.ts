import { NotificationDocument, NotificationModel } from '@models/Notification';
import { AppError } from '@utils/AppError';
import { CreateNotification } from 'types/CreateNotification';

class NotificationService {
  async createNotification(
    notificationData: CreateNotification,
  ): Promise<NotificationDocument> {
    const notification = new NotificationModel(notificationData);
    return notification;
  }

  async getUserNotifications(userId: string, limit: number = 50) {
    const notifications = await NotificationModel.find({ user: userId })
      .limit(limit)
      .populate('relatedEvent')
      .populate('relatedRequest')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return notifications as NotificationDocument[];
  }

  async markAsRead(
    notificationId: string,
    userId: string,
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
    notificationId: string,
    userId: string,
  ): Promise<NotificationDocument> {
    const notification = await NotificationModel.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return notification;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await NotificationModel.countDocuments({
      user: userId,
      isRead: false,
    });
  }
}

export default new NotificationService();
