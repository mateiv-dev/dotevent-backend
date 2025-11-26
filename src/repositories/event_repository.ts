import { EventDocument, IEvent } from "../models/event";
import Event from '../schemas/Event';

class EventRepository {

    async getEvents(): Promise<EventDocument[]> {
        return await Event.find();
    }

    async getEvent(id: string): Promise<EventDocument | null> {
        return await Event.findById(id);
    }

    async createEvent(EventData: IEvent): Promise<EventDocument> {
        const newEvent = new Event(EventData);
        return await newEvent.save();
    }

    async deleteEvent(id: string): Promise<EventDocument | null> {
        return await Event.findByIdAndDelete(id);
    }

    async updateEvent(id: string, EventNewData: IEvent): Promise<EventDocument | null> {
        return await Event.findByIdAndUpdate(
            id,
            EventNewData,
            { new: true, runValidators: true }
        );
    }
}

export default new EventRepository();
