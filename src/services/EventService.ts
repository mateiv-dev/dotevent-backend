import { EventModel, EventDocument } from '@models/Event';
import { EventStatus } from 'types/EventStatus';

export interface EventFilters {
  eventType?: string; 
  faculty?: string;
  department?: string;
  organizer?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

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
        const securedEventData = {
            ...eventData,
            status: EventStatus.PENDING
        };
        
        const newEvent = new EventModel(securedEventData);
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

    async getFilteredEvents(filters: EventFilters = {}): Promise<EventDocument[]> {
        const query: any = {};

        query.status = EventStatus.APPROVED;
        
        if (filters.eventType) {
            query.eventType = filters.eventType;
        }

        const caseInsensitiveOptions = { $options: 'i' };

        if (filters.faculty) {
            query.faculty = { $regex: filters.faculty, ...caseInsensitiveOptions };
        }

        if (filters.department) {
            query.department = { $regex: filters.department, ...caseInsensitiveOptions };
        }

        if (filters.location) {
            query.location = { $regex: filters.location, ...caseInsensitiveOptions };
        }

        if (filters.organizer) {
            query.organizerName = { $regex: filters.organizer, ...caseInsensitiveOptions };
        }

        if (filters.startDate || filters.endDate) {
            query.date = {};

            if (filters.startDate) {
                const startOfDay = new Date(new Date(filters.startDate).toDateString()); 
                query.date.$gte = startOfDay; 
            }

            if (filters.endDate) {
                const endOfDay = new Date(new Date(filters.endDate).toDateString()); 
                endOfDay.setDate(endOfDay.getDate() + 1);
                query.date.$lt = endOfDay; 
            }
        }

        return await EventModel.find(query).sort({ date: 1 }).exec();
    }
}

export default new EventService();
