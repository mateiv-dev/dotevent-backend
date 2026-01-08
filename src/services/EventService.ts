import {
  CreateAttachmentDto,
  CreateEventDto,
  UpdateEventDto,
} from '@dtos/EventDto';
import { EventModel, PopulatedEventDocument } from '@models/Event';
import { FavoriteEventModel } from '@models/FavoriteEvent';
import { NotificationModel } from '@models/Notification';
import { RegistrationModel } from '@models/Registration';
import { ReviewModel } from '@models/Review';
import { AppError } from '@utils/AppError';
import mongoose from 'mongoose';
import { EventStatus } from 'types/EventStatus';
import { FileType } from 'types/FileType';
import { INotification } from 'types/INotification';
import { NotificationType } from 'types/NotificationType';
import NotificationService from './NotificationService';
import StorageService from './StorageService';

export interface EventFilters {
  eventType?: string;
  faculty?: string;
  department?: string;
  organizer?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

export const EVENT_POPULATE_OPTIONS = [
  { path: 'author', select: '-_id name email role' },
  { path: 'proccessedBy', select: '-_id name email' },
];

const SORT_DIRECTION = -1;

class EventService {
  async getFilteredEvents(
    filters: EventFilters = {},
  ): Promise<PopulatedEventDocument[]> {
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

    const events = await EventModel.find(query)
      .sort({ date: SORT_DIRECTION })
      .populate(EVENT_POPULATE_OPTIONS)
      .lean()
      .exec();

    return events as unknown as PopulatedEventDocument[];
  }

  async getEventsByStatus(
    status: EventStatus,
  ): Promise<PopulatedEventDocument[]> {
    const events = await EventModel.find({
      status: status,
    })
      .sort({ date: SORT_DIRECTION })
      .populate(EVENT_POPULATE_OPTIONS)
      .lean()
      .exec();

    return events as unknown as PopulatedEventDocument[];
  }

  async getEvent(id: string): Promise<PopulatedEventDocument | null> {
    const event = await EventModel.findById(id).exec();

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    return event as unknown as PopulatedEventDocument;
  }

  async getPopulatedEvent(id: string): Promise<PopulatedEventDocument | null> {
    const event = await EventModel.findById(id)
      .populate(EVENT_POPULATE_OPTIONS)
      .exec();

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    return event as unknown as PopulatedEventDocument;
  }

  async getUserEvents(userId: string): Promise<PopulatedEventDocument[]> {
    const userEvents = await EventModel.find({ author: userId })
      .sort({ date: SORT_DIRECTION })
      .populate(EVENT_POPULATE_OPTIONS)
      .lean()
      .exec();

    return userEvents as unknown as PopulatedEventDocument[];
  }

  async getUserFavoriteEvents(
    userId: string,
  ): Promise<PopulatedEventDocument[]> {
    const favorites = await FavoriteEventModel.find({ user: userId })
      .sort({ date: SORT_DIRECTION })
      .populate({
        path: 'event',
        populate: EVENT_POPULATE_OPTIONS,
      })
      .lean()
      .exec();

    return favorites
      .map((fav) => fav.event)
      .filter((event) => event !== null) as unknown as PopulatedEventDocument[];
  }

  private getValidatedEventDate(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const eventDate = new Date(date);
    eventDate.setHours(hours!, minutes!, 0, 0);

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
  ): Promise<PopulatedEventDocument> {
    try {
      const eventDate = this.getValidatedEventDate(
        newEventData.date,
        newEventData.time,
      );

      let attachments: CreateAttachmentDto[] = [];
      let titleImageUrl: string | null = null;

      if (files && files.length > 0) {
        attachments = StorageService.processUploadedFiles(files);

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

        StorageService.sortAttachments(attachments);
      }

      const newEvent = new EventModel({
        ...newEventData,
        author: userId,
        date: eventDate,
        attachments: attachments,
        titleImage: titleImageUrl,
      });

      const savedEvent = await newEvent.save();

      await savedEvent.populate(EVENT_POPULATE_OPTIONS);

      return savedEvent.toObject() as unknown as PopulatedEventDocument;
    } catch (error) {
      if (files && files.length > 0) {
        const fileNames = files.map((file) => file.filename);
        await StorageService.deleteFiles(fileNames);
      }

      throw error;
    }
  }

  async updateEvent(
    userId: string,
    eventId: string,
    newEventData: UpdateEventDto,
    newFiles: Express.Multer.File[] = [],
  ): Promise<PopulatedEventDocument | null> {
    const event = await EventModel.findById(eventId).exec();

    if (!event) {
      const fileNames = newFiles.map((file) => file.filename);
      await StorageService.deleteFiles(fileNames);
      throw new AppError('Event not found', 404);
    }

    if (userId !== event.author) {
      throw new AppError('You cannot modify the foreign event', 409);
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
      await StorageService.deleteFiles(filePaths);

      deleteAttachments.forEach((id) => event.attachments.pull({ _id: id }));
    }

    try {
      StorageService.validateFileLimit(
        event.attachments.length,
        newFiles.length,
      );
    } catch (error) {
      const fileNames = newFiles.map((file) => file.filename);
      await StorageService.deleteFiles(fileNames);
      throw error;
    }

    if (newFiles.length > 0) {
      const newAttachments = StorageService.processUploadedFiles(newFiles);
      event.attachments.push(...newAttachments);
    }

    StorageService.sortAttachments(event.attachments);

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

    const savedEvent = await event.save();

    await savedEvent.populate(EVENT_POPULATE_OPTIONS);

    return savedEvent.toObject() as unknown as PopulatedEventDocument;
  }

  async deleteEvent(id: string): Promise<void> {
    const event = await EventModel.findById(id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.attachments.length > 0) {
      const fileNames = event.attachments.map((file) => file.url);
      await StorageService.deleteFiles(fileNames);
    }

    const registrations = await RegistrationModel.find({ event: id })
      .select('user')
      .lean()
      .exec();
    const favorites = await FavoriteEventModel.find({ event: id })
      .select('user')
      .lean()
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
      const notification: INotification = {
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

  async approveEvent(
    adminId: string,
    eventId: String,
  ): Promise<PopulatedEventDocument> {
    const event = await EventModel.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.status !== EventStatus.PENDING) {
      throw new AppError('Event already proccessed', 409);
    }

    event.status = EventStatus.APPROVED;
    event.proccessedBy = adminId;
    event.proccessedAt = new Date();

    const savedEvent = await event.save();

    if (savedEvent.author) {
      const notificationData: INotification = {
        user: savedEvent.author,
        title: 'Event Approved',
        message: `Your event "${event.title}" has been approved!`,
        type: NotificationType.EVENT_APPROVED,
        relatedEvent: event._id.toString(),
      };

      await NotificationService.createNotification(notificationData);
    }

    await savedEvent.populate(EVENT_POPULATE_OPTIONS);

    return savedEvent.toObject() as unknown as PopulatedEventDocument;
  }

  async rejectEvent(
    adminId: string,
    eventId: string,
    rejectionReason: string,
  ): Promise<PopulatedEventDocument> {
    const event = await EventModel.findById(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.status !== EventStatus.PENDING) {
      throw new AppError('Event already processed', 409);
    }

    event.status = EventStatus.REJECTED;
    event.rejectionReason = rejectionReason;
    event.proccessedBy = adminId;
    event.proccessedAt = new Date();

    const savedEvent = await event.save();

    if (savedEvent.author) {
      const notificationData: INotification = {
        user: savedEvent.author,
        title: 'Event Rejected',
        message: `Your event "${event.title}" has been rejected.`,
        type: NotificationType.EVENT_REJECTED,
        relatedEvent: event._id.toString(),
      };

      await NotificationService.createNotification(notificationData);
    }

    await savedEvent.populate(EVENT_POPULATE_OPTIONS);

    return savedEvent.toObject() as unknown as PopulatedEventDocument;
  }

  async markFavoriteEvent(
    userId: string,
    eventId: string,
  ): Promise<PopulatedEventDocument> {
    const existing = await FavoriteEventModel.findOne({
      user: userId,
      event: eventId,
    })
      .populate({
        path: 'event',
        populate: EVENT_POPULATE_OPTIONS,
      })
      .lean()
      .exec();

    if (existing) {
      throw new AppError('Event is already in favorites', 409);
      // return existing.event as unknown as PopulatedEventDocument;
    }

    const newFavorite = await FavoriteEventModel.create({
      user: userId,
      event: eventId,
    });

    const populatedFavorite = await newFavorite.populate({
      path: 'event',
      populate: EVENT_POPULATE_OPTIONS,
    });

    return populatedFavorite.event as unknown as PopulatedEventDocument;
  }

  async unmarkFavoriteEvent(userId: string, eventId: string): Promise<void> {
    const deletedFavorite = await FavoriteEventModel.findOneAndDelete({
      user: userId,
      event: eventId,
    });

    if (!deletedFavorite) {
      throw new AppError('Favorite Event not found', 404);
    }
  }
}

export default new EventService();
