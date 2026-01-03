import { Request, Response } from 'express';
import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import { AppError } from '@utils/AppError';
import { ResponseEventDto } from '@dtos/EventDto';
import EventService, { EventFilters } from '@services/EventService';
import { EventStatus } from 'types/EventStatus';
import EventRegistrationService from '@services/EventRegistrationService';
import FavoriteEventService from '@services/FavoriteEventService';

export const getFilteredEvents = asyncErrorHandler(async (req: Request, res: Response) => {
    const filters: EventFilters = req.query;
    const events = await EventService.getFilteredEvents(filters);
    res.status(200).json(ResponseEventDto.fromArray(events));
});

export const getPendingEvents = asyncErrorHandler(async (_req: Request, res: Response) => {
    const events = await EventService.getEvents(EventStatus.PENDING);
    res.status(200).json(events);
});

export const getEvent = asyncErrorHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError('Invalid event ID format supplied', 400);
    }

    const event = await EventService.getEvent(id);

    if (!event) {
        throw new AppError('Event not found', 404);
    }

    res.status(200).json(ResponseEventDto.from(event));
});

export const createEvent = asyncErrorHandler(async (req: Request, res: Response) => {
    const eventData = req.body;
    const files = req.files as Express.Multer.File[];
    const createdEvent = await EventService.createEvent(eventData, files);
    res.status(201).json(ResponseEventDto.from(createdEvent));
});

export const deleteEvent = asyncErrorHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError('Invalid event ID format supplied', 400);
    }

    const deletedEvent = await EventService.deleteEvent(id);

    if (!deletedEvent) {
        throw new AppError('Event not found', 404);
    }
        
    res.status(200).json(ResponseEventDto.from(deletedEvent));
});

export const updateEvent = asyncErrorHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateEventData: Event = req.body;

    if (!id) {
        throw new AppError('Invalid event ID format supplied', 400);
    }

    const updatedEvent = await EventService.updateEvent(
        id, 
        updateEventData 
    );

    if (!updatedEvent) {
        throw new AppError('Event not found', 404);
    }
    
    res.status(200).json(ResponseEventDto.from(updatedEvent));
});

export const registerParticipant = asyncErrorHandler(async (req: Request, res: Response) => {
    const { id: eventId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
        throw new AppError('Invalid user ID format supplied', 400);
    }

    if (!eventId) {
        throw new AppError('Invalid event ID format supplied', 400);
    }

    const registration = await EventRegistrationService.registerParticipant(userId, eventId);

    res.status(200).json(registration.ticketCode);
});

export const unregisterParticipant = asyncErrorHandler(async (req: Request, res: Response) => {
    const { id: eventId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
        throw new AppError('Invalid user ID format supplied', 400);
    }

    if (!eventId) {
        throw new AppError('Invalid event ID format supplied', 400);
    }

    await EventRegistrationService.unregisterParticipant(userId, eventId);

    res.status(200).send();
});

export const addEventToFavorites = asyncErrorHandler(async (req: Request, res: Response) => {
  const firebaseId = req.user!.uid;
  const { id: eventId } = req.params;

  if (!eventId || eventId?.trim().length === 0) {
    throw new AppError('Parameter \'eventId\' is required', 400);
  }

  const event = await FavoriteEventService.markFavorite(firebaseId, eventId);

  res.status(200).json(ResponseEventDto.from(event));
});

export const removeEventFromFavorites = asyncErrorHandler(async (req: Request, res: Response) => {
  const firebaseId = req.user!.uid;
  const { id: eventId } = req.params;

  if (!eventId || eventId?.trim().length === 0) {
    throw new AppError('Parameter \'eventId\' is required', 400);
  }

  await FavoriteEventService.unmarkFavorite(firebaseId, eventId);
  
  res.status(200).json();
});
