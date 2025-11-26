import { EventDocument, IEvent } from "../models/event";
import EventRepository from "../repositories/event_repository";

class EventService {

    async getEvents(): Promise<EventDocument[]> {
        return await EventRepository.getEvents();
    }

    async getEvent(id: string): Promise<EventDocument | null> {
        return await EventRepository.getEvent(id);
    }

    async createEvent(eventData: IEvent): Promise<EventDocument> {
        return await EventRepository.createEvent(eventData);
    }

    async deleteEvent(id: string): Promise<EventDocument | null> {
        return await EventRepository.deleteEvent(id);
    }

    async updateEvent(id: string, eventNewData: IEvent): Promise<EventDocument | null> {
        return await EventRepository.updateEvent(id, eventNewData);
    }
}

export default new EventService();
