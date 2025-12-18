import { NotificationDocument, NotificationModel } from '@models/Notification';
import { AppError } from '@utils/AppError';

class NotificationService {
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'event_approved' | 'event_rejected' | 'role_approved' | 'role_rejected' | 'event_reminder' | 'event_update',
    relatedEvent?: string,
    relatedRequest?: string
  ): Promise<NotificationDocument> {
    const notificationData: any = {
      user: userId,
      title,
      message,
      type
    };

    if (relatedEvent) {
      notificationData.relatedEvent = relatedEvent;
    }

    if (relatedRequest) {
      notificationData.relatedRequest = relatedRequest;
    }

    const notification = await NotificationModel.create(notificationData);

    return notification as unknown as NotificationDocument;
  }

  async getUserNotifications(userId: string, limit: number = 50) {
    const notifications = await NotificationModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('relatedEvent')
      .populate('relatedRequest')
      .exec();

    return notifications as NotificationDocument[];
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument> {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await NotificationModel.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<NotificationDocument> {
    const notification = await NotificationModel.findOneAndDelete({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return notification;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await NotificationModel.countDocuments({
      user: userId,
      isRead: false
    });
  }
}

export default new NotificationService();
