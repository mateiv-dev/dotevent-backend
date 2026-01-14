import { ResponseNotificationDto } from '@dtos/NotificationDto';
import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import { EventModel } from '@models/Event';
import NotificationService from '@services/NotificationService';
import { AppError } from '@utils/AppError';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const getNotifications = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const notifications = await NotificationService.getUserNotifications(
      userId,
      limit,
    );

    res.status(200).json(ResponseNotificationDto.fromArray(notifications));
  },
);

export const markAsRead = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const { id } = req.params;

    if (!id) {
      throw new Error('Notification ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid notification ID', 400);
    }

    const notification = await NotificationService.markAsRead(userId, id);

    res.status(200).json(ResponseNotificationDto.from(notification));
  },
);

export const markAllAsRead = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;

    const count = await NotificationService.markAllAsRead(userId);

    res.status(200).json({ count });
  },
);

export const deleteNotification = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const { notificationId } = req.params;

    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    await NotificationService.deleteNotification(userId, notificationId);

    res.status(200).send();
  },
);

export const getUnreadCount = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;

    const count = await NotificationService.getUnreadCount(userId);

    res.status(200).json({ count });
  },
);

export const createEventUpdatedNotifications = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { eventId } = req.params;

    if (!eventId) {
      throw new Error('Event ID is required');
    }

    const event = await EventModel.findById(eventId).select('title');
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    await NotificationService.createEventUpdatedNotifications(
      eventId,
      event.title,
    );

    res.status(200).send();
  },
);
