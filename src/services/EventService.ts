import { EventModel, EventDocument } from '@models/Event';
import { EventStatus } from 'types/EventStatus';

class EventService {

    async getEvents(status: EventStatus): Promise<EventDocument[]> {
        return await EventModel.find({ 
            status: status 
        }).exec();
    }
    
    async getEvent(id: string): Promise<EventDocument | null> {
        return await EventModel.findById(id).exec();
    }

    async createEvent(eventData: Event): Promise<EventDocument> {
        const newEvent = new EventModel(eventData);
        return await newEvent.save();
    }

    async deleteEvent(id: string): Promise<EventDocument | null> {
        return await EventModel.findByIdAndDelete(id).exec();
    }

    async updateEvent(id: string, eventNewData: Event): Promise<EventDocument | null> {
        return await EventModel.findByIdAndUpdate(
            id,
            eventNewData,
            { new: true, runValidators: true }
        ).exec();
    }
}

export default new EventService();
