import { EventDocument } from '../models/event'; 
import { EventCategory } from '../models/event_category';

export class EventDTO {

    public id: string;
    public title: string;
    public date: Date;
    public time: string;
    public location: string;
    public category: EventCategory;
    public attendees: number;
    public capacity: number;
    public isRegistered: boolean;
    public organizer: string;
    public description: string;

    constructor(event: EventDocument) {
        this.id = event._id.toString();
        this.title = event.title;
        this.date = event.date;
        this.time = event.time;
        this.location = event.location;
        this.category = event.category;
        this.attendees = event.attendees;
        this.capacity = event.capacity;
        this.isRegistered = event.isRegistered;
        this.organizer = event.organizer;
        this.description = event.description;
    }
    
    static cut(event: EventDocument): EventDTO | null {
        if (!event) {
            return null;
        }
        return new EventDTO(event);
    }

    static cutList(events: EventDocument[]): EventDTO[] {
        if (!events) {
            return [];
        }

        return events.map(event => new EventDTO(event));
    }
}
