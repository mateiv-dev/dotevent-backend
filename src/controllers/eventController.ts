import { Request, Response } from 'express';
import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import { AppError } from '@utils/AppError';
import { ResponseEventDto } from '@dtos/EventDto';
import EventService from '@services/EventService';
import { EventStatus } from 'types/EventStatus';

export const getApprovedEvents = asyncErrorHandler(async (_req: Request, res: Response) => {
    const events = await EventService.getEvents(EventStatus.APPROVED);
    res.status(200).json(ResponseEventDto.fromArray(events));
});

export const getPendingEvents = asyncErrorHandler(async (_req: Request, res: Response) => {
    const events = await EventService.getEvents(EventStatus.PENDING);
    res.status(200).json(ResponseEventDto.fromArray(events));
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
    const eventData: Event = req.body;
    // const validatedEventData: CreateEventDto = createEventSchema.safeParse(req.body);

    const createdEvent = await EventService.createEvent(eventData);
    
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
