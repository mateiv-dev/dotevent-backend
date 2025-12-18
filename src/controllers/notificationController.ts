import { Request, Response } from 'express';
import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import NotificationService from '@services/NotificationService';

export const getNotifications = asyncErrorHandler(async (req: Request, res: Response) => {
  const userId = req.user!.uid;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

  const notifications = await NotificationService.getUserNotifications(userId, limit);
  res.status(200).json(notifications);
});

export const markAsRead = asyncErrorHandler(async (req: Request, res: Response) => {
  const userId = req.user!.uid;
  const { id } = req.params;

  if (!id) {
    throw new Error('Notification ID is required');
  }

  const notification = await NotificationService.markAsRead(id, userId);
  res.status(200).json(notification);
});

export const markAllAsRead = asyncErrorHandler(async (req: Request, res: Response) => {
  const userId = req.user!.uid;

  await NotificationService.markAllAsRead(userId);
  res.status(200).json({ message: 'All notifications marked as read' });
});

export const deleteNotification = asyncErrorHandler(async (req: Request, res: Response) => {
  const userId = req.user!.uid;
  const { id } = req.params;

  if (!id) {
    throw new Error('Notification ID is required');
  }

  const notification = await NotificationService.deleteNotification(id, userId);
  res.status(200).json(notification);
});

export const getUnreadCount = asyncErrorHandler(async (req: Request, res: Response) => {
  const userId = req.user!.uid;

  const count = await NotificationService.getUnreadCount(userId);
  res.status(200).json({ count });
});
