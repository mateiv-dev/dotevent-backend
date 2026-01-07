import {
  CreateEventDto,
  ResponseEventDto,
  UpdateEventDto,
} from '@dtos/EventDto';
import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import EventRegistrationService from '@services/EventRegistrationService';
import EventService, { EventFilters } from '@services/EventService';
import FavoriteEventService from '@services/FavoriteEventService';
import { AppError } from '@utils/AppError';
import { Request, Response } from 'express';
import { EventStatus } from 'types/EventStatus';

export const getEvents = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const filters: EventFilters = req.query;

    const hasFilters = Object.keys(filters).length > 0;

    let events;

    if (hasFilters) {
      events = await EventService.getFilteredEvents(filters);
    } else {
      events = await EventService.getEventsByStatus(EventStatus.APPROVED);
    }

    res.status(200).json(ResponseEventDto.fromArray(events));
  },
);

export const getPendingEvents = asyncErrorHandler(
  async (_req: Request, res: Response) => {
    const events = await EventService.getEventsByStatus(EventStatus.PENDING);
    res.status(200).json(events);
  },
);

export const getEvent = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Event ID is required', 400);
    }

    const event = await EventService.getEvent(id);

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
    const { id } = req.params;

    if (!id) {
      throw new AppError('Invalid event ID format supplied', 400);
    }

    await EventService.deleteEvent(id);

    res.status(200).json();
  },
);

export const updateEvent = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateEventData: UpdateEventDto = req.body;

    if (!id) {
      throw new AppError('Invalid event ID format supplied', 400);
    }

    const updatedEvent = await EventService.updateEvent(id, updateEventData);

    if (!updatedEvent) {
      throw new AppError('Event not found', 404);
    }

    res.status(200).json(ResponseEventDto.from(updatedEvent));
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

    res.status(200).json(registration.ticketCode);
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

export const addEventToFavorites = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const firebaseId = req.user!.uid;
    const { eventId } = req.params;

    if (!eventId || eventId?.trim().length === 0) {
      throw new AppError("Parameter 'eventId' is required", 400);
    }

    const event = await FavoriteEventService.markFavorite(firebaseId, eventId);

    res.status(200).json(ResponseEventDto.from(event));
  },
);

export const removeEventFromFavorites = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const firebaseId = req.user!.uid;
    const { eventId } = req.params;

    if (!eventId || eventId?.trim().length === 0) {
      throw new AppError("Parameter 'eventId' is required", 400);
    }

    await FavoriteEventService.unmarkFavorite(firebaseId, eventId);

    res.status(200).json();
  },
);
