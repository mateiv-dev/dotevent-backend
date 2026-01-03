import { EventModel, EventDocument } from '@models/Event';
import { EventStatus } from 'types/EventStatus';
import path from 'path';
import fs from 'fs';
import { FavoriteEventModel } from '@models/FavoriteEvent';

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

    async getMeFavoriteEvents(id: string): Promise<EventDocument[]> {
        const favorites = await FavoriteEventModel.find({ user: id })
            .populate<{ event: EventDocument }>('event')
            .exec();
        
        return favorites.map(fav => fav.event);
    }
    
    async createEvent(eventData: Partial<Event>, files?: Express.Multer.File[]): Promise<EventDocument> {
        try {
            let attachments: any[] = [];

            if (files && files.length > 0) {
                attachments = files.map(file => ({
                    url: `/uploads/${file.filename}`,
                    name: file.originalname,
                    fileType: file.mimetype.startsWith('image') ? 'image' : 'document'
                }));
            }

            attachments.sort((a, b) => {
                if (a.fileType === 'image' && b.fileType !== 'image') return -1;
                if (a.fileType !== 'image' && b.fileType === 'image') return 1;
                return a.url.localeCompare(b.url);
            });

            const securedEventData = {
                ...eventData,
                attachments: attachments,
                status: EventStatus.PENDING,
                attendees: 0,
            };
            
            const newEvent = new EventModel(securedEventData);

            return await newEvent.save();
        }
        catch (error) {
            if (files && files.length > 0) {
                await this.deleteFiles(files);
            }

            throw error;
        }
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

    private async deleteFiles(files: Express.Multer.File[]): Promise<void> {
        const deletionPromises = files.map(file => {
            const filePath = path.join(process.cwd(), 'uploads', file.filename);

            return new Promise<void>((resolve) => {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(`[Cleanup] Could not be deleted: ${file.filename}`, err);
                    }
                    resolve();
                });
            });
        });

        await Promise.all(deletionPromises);
    }
}

export default new EventService();
