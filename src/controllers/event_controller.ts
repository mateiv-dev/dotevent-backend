import { Request, Response } from "express";
import { asyncErrorHandler } from "../middlewares/async_error_handler";
import { AppError } from "../utils/app_error";
import { IEvent } from "../models/event";
import EventService from "../services/event_service";
import { EventDTO } from "../dtos/event_dto";

export const getEvents = asyncErrorHandler(async (req: Request, res: Response) => {
    const events = await EventService.getEvents();
    res.status(200).json(EventDTO.cutList(events));
});

export const getEvent = asyncErrorHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError("Invalid event ID format supplied", 400);
    }

    const event = await EventService.getEvent(id);

    if (!event) {
        throw new AppError("Event not found", 404);
    }

    res.status(200).json(EventDTO.cut(event));
});

export const createEvent = asyncErrorHandler(async (req: Request, res: Response) => {
    const eventData: IEvent = req.body;
    
    const createdEvent = await EventService.createEvent(eventData);
    
    res.status(201).json(EventDTO.cut(createdEvent));
});

export const deleteEvent = asyncErrorHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError("Invalid event ID format supplied", 400);
    }

    const deletedEvent = await EventService.deleteEvent(id);

    if (!deletedEvent) {
        throw new AppError('Event not found', 404);
    }
        
    res.status(200).json(EventDTO.cut(deletedEvent));
});

export const updateEvent = asyncErrorHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateEventData: IEvent = req.body; 

    if (!id) {
        throw new AppError("Invalid event ID format supplied", 400);
    }

    const updatedEvent = await EventService.updateEvent(
        id, 
        updateEventData 
    );

    if (!updatedEvent) {
        throw new AppError('Event not found', 404);
    }
    
    res.status(200).json(EventDTO.cut(updatedEvent));
});
