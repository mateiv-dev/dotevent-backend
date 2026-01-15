import {
  CreateEventDto,
  ResponseEventDto,
  UpdateEventDto,
} from '@dtos/EventDto';
import { ResponseRegistrationDto } from '@dtos/RegistrationDto';
import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import EventRegistrationService from '@services/EventRegistrationService';
import EventService, { EventFilters } from '@services/EventService';
import { AppError } from '@utils/AppError';
import { Request, Response } from 'express';

export const getApprovedEvents = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const page = req.query.page
      ? parseInt(req.query.page as string)
      : undefined;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;

    const { page: _p, limit: _l, ...filtersRaw } = req.query as any;

    const hasFilters = Object.keys(filtersRaw).length > 0;

    let result;

    if (hasFilters) {
      const filters: EventFilters = filtersRaw;

      result = await EventService.getFilteredApprovedEvents(
        filters,
        page,
        limit,
      );
    } else {
      result = await EventService.getApprovedEvents(page, limit);
    }

    if (page && limit) {
      res.status(200).json({
        events: ResponseEventDto.fromArray(result.events),
        total: result.total,
      });
    } else {
      res.status(200).json(ResponseEventDto.fromArray(result.events));
    }
  },
);

export const getRecommendedEvents = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;

    const pageParam = req.query.page
      ? parseInt(req.query.page as string)
      : undefined;
    const limitParam = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;

    const page = pageParam && !isNaN(pageParam) ? pageParam : undefined;
    const limit = limitParam && !isNaN(limitParam) ? limitParam : undefined;

    const events = await EventService.getRecommendedEvents(userId, page, limit);

    res.status(200).json(ResponseEventDto.fromArray(events));
  },
);

export const getPendingEvents = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const page = req.query.page
      ? parseInt(req.query.page as string)
      : undefined;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;

    const result = await EventService.getPendingEvents(page, limit);

    if (page && limit) {
      res.status(200).json({
        events: ResponseEventDto.fromArray(result.events),
        total: result.total,
      });
    } else {
      res.status(200).json(ResponseEventDto.fromArray(result.events));
    }
  },
);

export const getRejectedEvents = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const page = req.query.page
      ? parseInt(req.query.page as string)
      : undefined;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;

    const result = await EventService.getRejectedEvents(page, limit);

    if (page && limit) {
      res.status(200).json({
        events: ResponseEventDto.fromArray(result.events),
        total: result.total,
      });
    } else {
      res.status(200).json(ResponseEventDto.fromArray(result.events));
    }
  },
);

export const getEvent = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { eventId } = req.params;

    if (!eventId) {
      throw new AppError('Event ID is required', 400);
    }

    const event = await EventService.getPopulatedEvent(eventId);

    res.status(200).json(ResponseEventDto.from(event!));
  },
);

export const createEvent = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const newEventData: CreateEventDto = req.body;
    const files = req.files as Express.Multer.File[];

    const createdEvent = await EventService.createEvent(
      userId,
      newEventData,
      files,
    );

    res.status(201).json(ResponseEventDto.from(createdEvent));
  },
);

export const deleteEvent = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { eventId } = req.params;

    if (!eventId) {
      throw new AppError('Invalid event ID format supplied', 400);
    }

    await EventService.deleteEvent(eventId);

    res.status(200).send();
  },
);

export const updateEvent = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const { eventId } = req.params;
    const updateEventData: UpdateEventDto = req.body;
    const files = req.files as Express.Multer.File[];

    if (!eventId) {
      throw new AppError('Invalid Event ID format supplied', 400);
    }

    const updatedEvent = await EventService.updateEvent(
      userId,
      eventId,
      updateEventData,
      files,
    );

    if (!updatedEvent) {
      throw new AppError('Event not found', 404);
    }

    res.status(200).json(ResponseEventDto.from(updatedEvent));
  },
);

export const approveEvent = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user!.uid;
    const { eventId } = req.params;

    if (!eventId || eventId?.trim().length === 0) {
      throw new AppError("Parameter 'id' is required", 400);
    }

    const event = await EventService.approveEvent(adminId, eventId);

    res.status(200).json(ResponseEventDto.from(event));
  },
);

export const rejectEvent = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user!.uid;
    const { eventId } = req.params;

    if (!eventId || eventId?.trim().length === 0) {
      throw new AppError("Parameter 'id' is required", 400);
    }

    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new AppError("Field 'rejectionReason' is required", 400);
    }

    const event = await EventService.rejectEvent(
      adminId,
      eventId,
      rejectionReason,
    );

    res.status(200).json(ResponseEventDto.from(event));
  },
);

export const registerParticipant = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      throw new AppError('Invalid user ID format supplied', 400);
    }

    if (!eventId) {
      throw new AppError('Invalid event ID format supplied', 400);
    }

    const registration = await EventRegistrationService.registerParticipant(
      userId,
      eventId,
    );

    res.status(200).json(ResponseRegistrationDto.from(registration));
  },
);

export const unregisterParticipant = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      throw new AppError('Invalid user ID format supplied', 400);
    }

    if (!eventId) {
      throw new AppError('Invalid event ID format supplied', 400);
    }

    await EventRegistrationService.unregisterParticipant(userId, eventId);

    res.status(200).send();
  },
);

export const checkInParticipant = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.uid;
    const { eventId, ticketCode } = req.params;

    if (!userId) {
      throw new AppError('Invalid user ID format supplied', 400);
    }

    if (!eventId) {
      throw new AppError('Invalid event ID format supplied', 400);
    }

    if (!ticketCode) {
      throw new AppError('Invalid ticket code supplied', 400);
    }

    await EventRegistrationService.checkInParticipant(
      userId,
      eventId,
      ticketCode,
    );

    res.status(200).send();
  },
);

export const addEventToFavorites = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const { eventId } = req.params;

    if (!eventId || eventId?.trim().length === 0) {
      throw new AppError("Parameter 'eventId' is required", 400);
    }

    const event = await EventService.markFavoriteEvent(userId, eventId);

    res.status(200).json(ResponseEventDto.from(event));
  },
);

export const removeEventFromFavorites = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const { eventId } = req.params;

    if (!eventId || eventId?.trim().length === 0) {
      throw new AppError("Parameter 'eventId' is required", 400);
    }

    await EventService.unmarkFavoriteEvent(userId, eventId);

    res.status(200).send();
  },
);

export const getEventParticipants = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const { eventId } = req.params;

    if (!eventId) {
      throw new AppError("Parameter 'eventId' is required", 400);
    }

    const participants = await EventService.getEventParticipants(
      userId,
      eventId,
    );

    res.status(200).json(participants);
  },
);

export const exportParticipantsToCSV = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const { eventId } = req.params;

    if (!eventId) {
      throw new AppError("Parameter 'eventId' is required", 400);
    }

    const csvString = await EventService.exportEventParticipantsToCSV(
      userId,
      eventId,
    );

    res.status(200).send(csvString);
  },
);

export const getEventStatistics = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const { eventId } = req.params;

    if (!eventId) {
      throw new AppError("Parameter 'eventId' is required", 400);
    }

    const statistics = await EventService.getEventStatistics(userId, eventId);

    res.status(200).json(statistics);
  },
);
