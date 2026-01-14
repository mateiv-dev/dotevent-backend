import {
  CreateAttachmentDto,
  CreateEventDto,
  UpdateEventDto,
} from '@dtos/EventDto';
import {
  EventModel,
  PendingEventModel,
  PopulatedEventDocument,
  RejectedEventModel,
} from '@models/Event';
import { FavoriteEventModel } from '@models/FavoriteEvent';
import { RegistrationModel } from '@models/Registration';
import { ReviewModel } from '@models/Review';
import { AppError } from '@utils/AppError';
import mongoose from 'mongoose';
import { EventStatus } from 'types/EventStatus';
import { FileType } from 'types/FileType';
import { NotificationType } from 'types/NotificationType';
import NotificationService from './NotificationService';
import StorageService from './StorageService';
import UserService from './UserService';

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
  {
    path: 'author',
    select: '-_id name email role',
  },
  { path: 'proccessedBy', select: '-_id name email' },
  { path: 'updatedBy', select: '-_id name email' },
];

const SORT_DIRECTION = -1;
const DELETE_EVENT_HOURS_LIMIT = 24;

const PROTECTED_FIELDS = [
  '_id',
  'attendees',
  'averageRating',
  'reviewCount',
  'createdAt',
  'updatedAt',
  '__v',
];

class EventService {
  async getFilteredApprovedEvents(
    filters: EventFilters = {},
    page?: number,
    limit?: number,
  ): Promise<{ events: PopulatedEventDocument[]; total: number }> {
    const query: any = {
      status: EventStatus.APPROVED,
    };

    const caseInsensitiveOptions = { $options: 'i' };

    if (filters.eventType) {
      query.eventType = filters.eventType;
    }

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
      const organizerRegex = {
        $regex: filters.organizer,
        ...caseInsensitiveOptions,
      };

      query.$or = [
        { 'organizer.represents': organizerRegex },
        { 'organizer.organizationName': organizerRegex },
      ];
    }

    if (filters.startDate || filters.endDate) {
      query.date = {};

      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setDate(end.getDate() + 1);
        end.setHours(0, 0, 0, 0);
        query.date.$lt = end;
      }
    }

    let eventQuery = EventModel.find(query)
      .sort({ date: SORT_DIRECTION })
      .populate(EVENT_POPULATE_OPTIONS)
      .lean();

    if (page && limit) {
      eventQuery = eventQuery.skip((page - 1) * limit).limit(limit);
    }

    const [events, total] = await Promise.all([
      eventQuery.exec(),
      EventModel.countDocuments(query),
    ]);

    return {
      events: events as unknown as PopulatedEventDocument[],
      total,
    };
  }

  async getApprovedEvents(
    page?: number,
    limit?: number,
  ): Promise<{ events: PopulatedEventDocument[]; total: number }> {
    const query = { status: EventStatus.APPROVED };

    let eventQuery = EventModel.find(query)
      .sort({ date: SORT_DIRECTION })
      .populate(EVENT_POPULATE_OPTIONS)
      .lean();

    if (page && limit) {
      eventQuery = eventQuery.skip((page - 1) * limit).limit(limit);
    }

    const [events, total] = await Promise.all([
      eventQuery.exec(),
      EventModel.countDocuments(query),
    ]);

    return {
      events: events as unknown as PopulatedEventDocument[],
      total,
    };
  }

  async getPendingEvents(
    page?: number,
    limit?: number,
  ): Promise<{ events: PopulatedEventDocument[]; total: number }> {
    const query = {};

    let eventQuery = PendingEventModel.find(query)
      .sort({ date: SORT_DIRECTION })
      .populate(EVENT_POPULATE_OPTIONS)
      .lean();

    if (page && limit) {
      eventQuery = eventQuery.skip((page - 1) * limit).limit(limit);
    }

    const [events, total] = await Promise.all([
      eventQuery.exec(),
      PendingEventModel.countDocuments(query),
    ]);

    return {
      events: events as unknown as PopulatedEventDocument[],
      total,
    };
  }

  async getRejectedEvents(
    page?: number,
    limit?: number,
  ): Promise<{ events: PopulatedEventDocument[]; total: number }> {
    const query = {};

    let eventQuery = RejectedEventModel.find(query)
      .sort({ date: SORT_DIRECTION })
      .populate(EVENT_POPULATE_OPTIONS)
      .lean();

    if (page && limit) {
      eventQuery = eventQuery.skip((page - 1) * limit).limit(limit);
    }

    const [events, total] = await Promise.all([
      eventQuery.exec(),
      RejectedEventModel.countDocuments(query),
    ]);

    return {
      events: events as unknown as PopulatedEventDocument[],
      total,
    };
  }

  async getEvent(id: string): Promise<PopulatedEventDocument | null> {
    const event = await EventModel.findById(id).exec();

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    return event as unknown as PopulatedEventDocument;
  }

  async eventExists(id: string): Promise<boolean> {
    const event = await EventModel.findById(id).select('_id').lean().exec();

    if (event) {
      return true;
    }

    return false;
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

  async getUserOrganizationEvents(
    userId: string,
  ): Promise<PopulatedEventDocument[]> {
    const user = await UserService.getUser(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const conditions = [];

    if (user.represents) {
      conditions.push({ 'organizer.represents': user.represents });
    }

    if (user.organizationName) {
      conditions.push({ 'organizer.organizationName': user.organizationName });
    }

    if (conditions.length === 0) {
      return [];
    }

    const organizationEvents = await EventModel.find({
      $or: conditions,
    })
      .sort({ date: SORT_DIRECTION })
      .populate(EVENT_POPULATE_OPTIONS)
      .lean()
      .exec();

    return organizationEvents as unknown as PopulatedEventDocument[];
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
      const user = await UserService.getUser(userId);
      if (!user) {
        throw new AppError('User not found.', 404);
      }

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

      const newPendingEvent = new PendingEventModel({
        ...newEventData,
        author: userId,
        date: eventDate,
        attachments: attachments,
        titleImage: titleImageUrl,
        organizer: {
          represents: user.represents ?? undefined,
          organizationName: user.organizationName ?? undefined,
          contact: newEventData.contact,
        },
        status: EventStatus.PENDING,
        targetEventId: null,
      });

      const savedEvent = await newPendingEvent.save();

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
    const user = await UserService.getUser(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const originalEvent = await EventModel.findById(eventId).exec();

    if (!originalEvent) {
      const fileNames = newFiles.map((file) => file.filename);
      await StorageService.deleteFiles(fileNames);
      throw new AppError('Event not found', 404);
    }

    const isLocked = await PendingEventModel.exists({ targetEventId: eventId });

    if (isLocked) {
      const fileNames = newFiles.map((file) => file.filename);
      await StorageService.deleteFiles(fileNames);

      throw new AppError(
        'This event already has a pending modification request.',
        400,
      );
    }

    const matchesRepresentation =
      user.represents &&
      originalEvent.organizer.represents &&
      user.represents === originalEvent.organizer.represents;

    const matchesOrganization =
      user.organizationName &&
      originalEvent.organizer.organizationName &&
      user.organizationName === originalEvent.organizer.organizationName;

    if (!matchesRepresentation && !matchesOrganization) {
      throw new AppError(
        'You do not have permission to modify this event.',
        403,
      );
    }

    const eventTime = new Date(originalEvent.date);
    const [hours, minutes] = originalEvent.time.split(':').map(Number);
    eventTime.setHours(hours!, minutes!, 0, 0);

    const now = new Date();
    now.setSeconds(0, 0);

    if (eventTime <= now) {
      throw new AppError(
        'You cannot modify an event that has already occurred.',
        400,
      );
    }

    if (newEventData.date || newEventData.time) {
      const finalDate = newEventData.date || originalEvent.date;
      const finalTime = newEventData.time || originalEvent.time;
      originalEvent.date = this.getValidatedEventDate(finalDate, finalTime);
      originalEvent.time = finalTime;
    }

    const deleteAttachments = newEventData.deleteAttachments;

    if (deleteAttachments && deleteAttachments.length > 0) {
      const attachmentsToMark = originalEvent.attachments.filter((a) =>
        deleteAttachments.includes((a as any)._id.toString()),
      );

      const urlsToPendingDelete = attachmentsToMark.map((a) => a.url);

      originalEvent.pendingDeletedFileUrls.push(...urlsToPendingDelete);

      deleteAttachments.forEach((id) => {
        originalEvent.attachments.pull({ _id: id });
      });
    }

    try {
      StorageService.validateFileLimit(
        originalEvent.attachments.length,
        newFiles.length,
      );
    } catch (error) {
      const fileNames = newFiles.map((file) => file.filename);
      await StorageService.deleteFiles(fileNames);
      throw error;
    }

    if (newFiles.length > 0) {
      const newAttachments = StorageService.processUploadedFiles(newFiles);
      originalEvent.attachments.push(...newAttachments);
    }

    StorageService.sortAttachments(originalEvent.attachments);

    const currentTitleStillExists = originalEvent.attachments.some(
      (a) => a.url === originalEvent.titleImage,
    );

    if (newEventData.titleImageName) {
      const selectedTitle = originalEvent.attachments.find(
        (a) => a.name === newEventData.titleImageName,
      );
      if (selectedTitle) {
        originalEvent.titleImage = selectedTitle.url;
      }
    } else if (!currentTitleStillExists) {
      const firstAvailableImage = originalEvent.attachments.find(
        (a) => a.fileType === FileType.IMAGE,
      );
      originalEvent.titleImage = firstAvailableImage
        ? firstAvailableImage.url
        : null;
    }

    const updates = {
      ...newEventData,
      updatedBy: userId,
      targetEventId: originalEvent._id,
    };

    delete updates.deleteAttachments;
    delete updates.titleImageName;
    delete updates.date;
    delete updates.time;

    Object.assign(originalEvent, updates);

    const pendingEventData = originalEvent.toObject();
    delete (pendingEventData as any)._id;
    delete (pendingEventData as any).createdAt;
    delete (pendingEventData as any).updatedAt;
    delete (pendingEventData as any).__v;

    try {
      const eventCopy = new PendingEventModel({
        ...pendingEventData,
        targetEventId: originalEvent._id,
        status: EventStatus.PENDING,
      });

      await eventCopy.save();
      await eventCopy.populate(EVENT_POPULATE_OPTIONS);

      return eventCopy.toObject() as unknown as PopulatedEventDocument;
    } catch (error) {
      if (newFiles.length > 0) {
        const fileNames = newFiles.map((file) => file.filename);
        await StorageService.deleteFiles(fileNames);
      }
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<void> {
    const event = await EventModel.findById(id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const now = new Date();
    const eventDate = new Date(event.date);

    const diffInMilliseconds = eventDate.getTime() - now.getTime();
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

    if (diffInHours < DELETE_EVENT_HOURS_LIMIT) {
      throw new AppError(
        `Events cannot be deleted within ${DELETE_EVENT_HOURS_LIMIT} hours of starting.`,
        400,
      );
    }

    if (event.attachments.length > 0) {
      const fileNames = event.attachments.map((file) => file.url);
      await StorageService.deleteFiles(fileNames);
    }

    await NotificationService.createEventDeletedNotifications(id, event.title);

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
    pendingEventId: string,
  ): Promise<PopulatedEventDocument> {
    const admin = await UserService.getUser(adminId);
    if (!admin) throw new AppError('Admin not found', 404);

    const pendingEvent = await PendingEventModel.findById(pendingEventId);
    if (!pendingEvent) throw new AppError('Pending request not found', 404);

    let finalEvent;

    if (pendingEvent.targetEventId) {
      const originalEvent = await EventModel.findById(
        pendingEvent.targetEventId,
      );
      if (!originalEvent)
        throw new AppError('Original event no longer exists', 404);

      if (pendingEvent.pendingDeletedFileUrls?.length > 0) {
        const fileNames = pendingEvent.pendingDeletedFileUrls
          .map((url) => url.split('/').pop()!)
          .filter(Boolean);
        await StorageService.deleteFiles(fileNames);
      }

      const updatedData = pendingEvent.toObject();
      PROTECTED_FIELDS.forEach((field) => delete (updatedData as any)[field]);

      Object.assign(originalEvent, updatedData);
      originalEvent.status = EventStatus.APPROVED;
      originalEvent.proccessedBy = adminId;
      originalEvent.proccessedAt = new Date();
      originalEvent.pendingDeletedFileUrls = [];

      finalEvent = await originalEvent.save();

      await NotificationService.createEventUpdatedNotifications(
        originalEvent._id.toString(),
        originalEvent.title,
      );
    } else {
      const eventData = pendingEvent.toObject();
      delete (eventData as any)._id;

      finalEvent = await EventModel.create({
        ...eventData,
        status: EventStatus.APPROVED,
        proccessedBy: adminId,
        proccessedAt: new Date(),
      });
    }

    await PendingEventModel.findByIdAndDelete(pendingEventId);

    if (finalEvent.author) {
      await NotificationService.createNotification({
        user: finalEvent.author.toString(),
        title: finalEvent.title,
        type: NotificationType.EVENT_APPROVED,
        relatedEvent: finalEvent._id.toString(),
      });
    }

    const populated = await EventModel.findById(finalEvent._id)
      .populate(EVENT_POPULATE_OPTIONS)
      .lean()
      .exec();
    return populated as unknown as PopulatedEventDocument;
  }

  async rejectEvent(
    adminId: string,
    pendingEventId: string,
    rejectionReason: string,
  ): Promise<PopulatedEventDocument> {
    const pendingEvent = await PendingEventModel.findById(pendingEventId);
    if (!pendingEvent) throw new AppError('Pending request not found', 404);

    let filesToDelete: string[] = [];
    if (!pendingEvent.targetEventId) {
      filesToDelete = pendingEvent.attachments
        .map((a) => a.url.split('/').pop()!)
        .filter(Boolean);
    } else {
      const originalEvent = await EventModel.findById(
        pendingEvent.targetEventId,
      );
      if (originalEvent) {
        const originalUrls = new Set(
          originalEvent.attachments.map((a) => a.url),
        );
        filesToDelete = pendingEvent.attachments
          .filter((a) => !originalUrls.has(a.url))
          .map((a) => a.url.split('/').pop()!)
          .filter(Boolean);
      }
    }

    if (filesToDelete.length > 0)
      await StorageService.deleteFiles(filesToDelete);

    const rejectedData = pendingEvent.toObject();
    delete (rejectedData as any)._id;

    const rejectedDoc = await RejectedEventModel.create({
      ...rejectedData,
      status: EventStatus.REJECTED,
      rejectionReason,
      proccessedBy: adminId,
      proccessedAt: new Date(),
    });

    await PendingEventModel.findByIdAndDelete(pendingEventId);

    if (rejectedDoc.author) {
      await NotificationService.createNotification({
        user: rejectedDoc.author.toString(),
        title: rejectedDoc.title,
        type: NotificationType.EVENT_REJECTED,
        relatedEvent:
          rejectedDoc.targetEventId?.toString() || rejectedDoc._id.toString(),
      });
    }

    const populated = await rejectedDoc.populate(EVENT_POPULATE_OPTIONS);

    return populated.toObject() as unknown as PopulatedEventDocument;
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
