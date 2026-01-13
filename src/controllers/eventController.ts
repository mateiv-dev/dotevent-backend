import {
  CreateEventDto,
  ResponseEventDto,
  UpdateEventDto,
} from '@dtos/EventDto';
import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import EventRegistrationService from '@services/EventRegistrationService';
import EventService, { EventFilters } from '@services/EventService';
import { AppError } from '@utils/AppError';
import { Request, Response } from 'express';

export const getApprovedEvents = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const filters: EventFilters = req.query;

    const hasFilters = Object.keys(filters).length > 0;

    let events;

    if (hasFilters) {
      events = await EventService.getFilteredApprovedEvents(filters);
    } else {
      events = await EventService.getApprovedEvents();
    }

    res.status(200).json(ResponseEventDto.fromArray(events));
  },
);

export const getPendingEvents = asyncErrorHandler(
  async (_req: Request, res: Response) => {
    const events = await EventService.getPendingEvents();
    res.status(200).json(ResponseEventDto.fromArray(events));
  },
);

export const getRejectedEvents = asyncErrorHandler(
  async (_req: Request, res: Response) => {
    const events = await EventService.getRejectedEvents();
    res.status(200).json(ResponseEventDto.fromArray(events));
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

    res.status(200).json();
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

    res.status(200).json(registration);
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

    res.status(200).json();
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

    res.status(200).json();
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

    res.status(200).json();
  },
);
