import { MAX_FILES_COUNT, UPLOAD_DIR } from '@config/storage';
import {
  CreateAttachmentDto,
  CreateEventDto,
  UpdateEventDto,
} from '@dtos/EventDto';
import { EventDocument, EventModel } from '@models/Event';
import { FavoriteEventModel } from '@models/FavoriteEvent';
import { NotificationModel } from '@models/Notification';
import { RegistrationModel } from '@models/Registration';
import { ReviewModel } from '@models/Review';
import { AppError } from '@utils/AppError';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { CreateNotification } from 'types/CreateNotification';
import { EventStatus } from 'types/EventStatus';
import { FileType } from 'types/FileType';
import { NotificationType } from 'types/NotificationType';
import NotificationService from './NotificationService';

export interface EventFilters {
  eventType?: string;
  faculty?: string;
  department?: string;
  organizer?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

class EventService {
  async getEventsByStatus(status: EventStatus): Promise<EventDocument[]> {
    return await EventModel.find({
      status: status,
    })
      .lean()
      .exec();
  }

  async getEvent(id: string): Promise<EventDocument | null> {
    const event = await EventModel.findById(id).lean().exec();

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    return event;
  }

  async getUserEvents(userId: string): Promise<EventDocument[]> {
    const userEvents = await EventModel.find({ author: userId }).lean().exec();
    return userEvents;
  }

  async getUserFavoriteEvents(userId: string): Promise<EventDocument[]> {
    const favorites = await FavoriteEventModel.find({ user: userId })
      .populate<{ event: EventDocument }>('event')
      .lean()
      .exec();

    return favorites.map((fav) => fav.event);
  }
  private getValidatedEventDate(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const eventDate = new Date(date);
    eventDate.setUTCHours(hours!, minutes!, 0, 0);

    if (eventDate <= new Date()) {
      throw new AppError(
        'The event must be scheduled for a future date and time.',
        400,
      );
    }

    return eventDate;
  }

  async createEvent(
    userId: string,
    newEventData: CreateEventDto,
    files?: Express.Multer.File[],
  ): Promise<EventDocument> {
    try {
      const eventDate = this.getValidatedEventDate(
        newEventData.date,
        newEventData.time,
      );

      let attachments: CreateAttachmentDto[] = [];
      let titleImageUrl: string | null = null;

      if (files && files.length > 0) {
        attachments = files.map((file) => ({
          url: `/${UPLOAD_DIR}/${file.filename}`,
          name: file.originalname,
          fileType: file.mimetype.startsWith('image')
            ? FileType.IMAGE
            : FileType.DOCUMENT,
          size: file.size,
        }));

        if (newEventData.titleImageName) {
          const selectedTitle = attachments.find(
            (a) => a.name === newEventData.titleImageName,
          );
          if (selectedTitle) {
            titleImageUrl = selectedTitle.url;
          }
        }

        if (!titleImageUrl) {
          const firstImage = attachments.find(
            (a) => a.fileType === FileType.IMAGE,
          );
          if (firstImage) {
            titleImageUrl = firstImage.url;
          }
        }

        this.sortAttachments(attachments);
      }

      const newEvent = new EventModel({
        ...newEventData,
        author: userId,
        date: eventDate,
        attachments: attachments,
        titleImage: titleImageUrl,
      });

      return await newEvent.save();
    } catch (error) {
      if (files && files.length > 0) {
        const filePaths = files.map((file) => file.filename);
        await this.deleteFiles(filePaths);
      }

      throw error;
    }
  }

  async updateEvent(
    id: string,
    newEventData: UpdateEventDto,
    newFiles: Express.Multer.File[] = [],
  ): Promise<EventDocument | null> {
    const event = await EventModel.findById(id);

    if (!event) {
      const fileNames = newFiles.map((file) => file.filename);
      await this.deleteFiles(fileNames);
      throw new AppError('Event not found', 404);
    }

    if (newEventData.date || newEventData.time) {
      const finalDate = newEventData.date || event.date;
      const finalTime = newEventData.time || event.time;
      event.date = this.getValidatedEventDate(finalDate, finalTime);
      event.time = finalTime;
    }

    const deleteAttachments = newEventData.deleteAttachments;

    if (deleteAttachments && deleteAttachments.length > 0) {
      const filesToDelete = event.attachments.filter((a) =>
        deleteAttachments.includes(a._id.toString()),
      );

      const filePaths = filesToDelete.map((file) => file.url);
      await this.deleteFiles(filePaths);

      deleteAttachments.forEach((id) => event.attachments.pull({ _id: id }));
    }

    if (newFiles.length + event.attachments.length > MAX_FILES_COUNT) {
      const filePaths = newFiles.map((file) => file.filename);
      await this.deleteFiles(filePaths);

      throw new AppError(
        `Total file limit exceeded. Each event is allowed a maximum of ${MAX_FILES_COUNT} files.`,
        400,
      );
    }

    if (newFiles.length > 0) {
      const newAttachments = newFiles.map((file) => ({
        url: `/uploads/${file.filename}`,
        name: file.originalname,
        fileType: file.mimetype.startsWith('image')
          ? FileType.IMAGE
          : FileType.DOCUMENT,
        size: file.size,
      }));

      event.attachments.push(...newAttachments);
    }

    this.sortAttachments(event.attachments);

    const currentTitleStillExists = event.attachments.some(
      (a) => a.url === event.titleImage,
    );

    if (newEventData.titleImageName) {
      const selectedTitle = event.attachments.find(
        (a) => a.name === newEventData.titleImageName,
      );
      if (selectedTitle) {
        event.titleImage = selectedTitle.url;
      }
    } else if (!currentTitleStillExists) {
      const firstAvailableImage = event.attachments.find(
        (a) => a.fileType === FileType.IMAGE,
      );
      event.titleImage = (
        firstAvailableImage ? firstAvailableImage.url : null
      ) as string;
    }

    const updates = { ...newEventData };

    delete updates.deleteAttachments;
    delete updates.titleImageName;
    delete updates.date;
    delete updates.time;

    Object.assign(event, updates);

    return event.save();
  }

  async deleteEvent(id: string): Promise<void> {
    const event = await EventModel.findById(id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.attachments.length > 0) {
      const filePaths = event.attachments.map((file) => file.url);
      await this.deleteFiles(filePaths);
    }

    const registrations = await RegistrationModel.find({ event: id })
      .select('user')
      .exec();
    const favorites = await FavoriteEventModel.find({ event: id })
      .select('user')
      .exec();

    const uniqueUserIds = new Set<string>();
    registrations.forEach((reg) => uniqueUserIds.add(reg.user!.toString()));
    favorites.forEach((fav) => uniqueUserIds.add(fav.user!.toString()));

    const existingNotifications = await NotificationModel.find({
      relatedEvent: id,
      type: NotificationType.EVENT_DELETED,
    }).select('user');

    const notifiedUserIds = new Set(
      existingNotifications.map((n) => n.user!.toString()),
    );

    const usersToNotify = Array.from(uniqueUserIds).filter(
      (userId) => !notifiedUserIds.has(userId),
    );

    const notificationPromises = usersToNotify.map((userId) => {
      const notification: CreateNotification = {
        user: userId,
        relatedEvent: id,
        title: 'Event Deleted',
        message: `We are sorry to inform you that the event '${event.title}' has been deleted by the organizer.`,
        type: NotificationType.EVENT_DELETED,
      };

      return NotificationService.createNotification(notification);
    });

    await Promise.all(notificationPromises);

    await RegistrationModel.deleteMany({ event: id });
    await FavoriteEventModel.deleteMany({ event: id });
    await ReviewModel.deleteMany({ event: id });

    await EventModel.findByIdAndDelete(id);
  }

  async getFilteredEvents(
    filters: EventFilters = {},
  ): Promise<EventDocument[]> {
    const query: any = {};

    query.status = EventStatus.APPROVED;

    if (filters.eventType) {
      query.eventType = filters.eventType;
    }

    const caseInsensitiveOptions = { $options: 'i' };

    if (filters.faculty) {
      query.faculty = { $regex: filters.faculty, ...caseInsensitiveOptions };
    }

    if (filters.department) {
      query.department = {
        $regex: filters.department,
        ...caseInsensitiveOptions,
      };
    }

    if (filters.location) {
      query.location = { $regex: filters.location, ...caseInsensitiveOptions };
    }

    if (filters.organizer) {
      query.organizerName = {
        $regex: filters.organizer,
        ...caseInsensitiveOptions,
      };
    }

    if (filters.startDate || filters.endDate) {
      query.date = {};

      if (filters.startDate) {
        const startOfDay = new Date(new Date(filters.startDate).toDateString());
        query.date.$gte = startOfDay;
      }

      if (filters.endDate) {
        const endOfDay = new Date(new Date(filters.endDate).toDateString());
        endOfDay.setDate(endOfDay.getDate() + 1);
        query.date.$lt = endOfDay;
      }
    }

    return await EventModel.find(query).sort({ date: 1 }).exec();
  }

  private async deleteFileByPath(fullPath: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!fs.existsSync(fullPath)) return resolve();

      fs.unlink(fullPath, (err) => {
        if (err) console.error(`[Cleanup] Error deleting: ${fullPath}`, err);
        resolve();
      });
    });
  }

  private async deleteFiles(filePaths: string[]): Promise<void> {
    const deletionPromises = filePaths.map((relPath) => {
      const fileName = path.basename(relPath);
      const absolutePath = path.join(process.cwd(), UPLOAD_DIR, fileName);

      return this.deleteFileByPath(absolutePath);
    });

    await Promise.all(deletionPromises);
  }

  async updateRating(eventId: string): Promise<void> {
    const stats = await ReviewModel.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: '$event',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await EventModel.findByIdAndUpdate(eventId, {
        averageRating: parseFloat(stats[0].avgRating.toFixed(1)),
        reviewCount: stats[0].count,
      });
    } else {
      await EventModel.findByIdAndUpdate(eventId, {
        averageRating: 0,
        reviewCount: 0,
      });
    }
  }

  private sortAttachments(attachments: any[]) {
    attachments.sort((a, b) => {
      if (a.fileType === FileType.IMAGE && b.fileType !== FileType.IMAGE)
        return -1;
      if (a.fileType !== FileType.IMAGE && b.fileType === FileType.IMAGE)
        return 1;
      return 0;
    });
  }
}

export default new EventService();
