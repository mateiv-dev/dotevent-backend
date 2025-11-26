import { Document } from 'mongoose';
import { EventCategory } from './event_category';

export interface IEvent {
  title: string;
  date: Date;
  time: string;
  location: string;
  category: EventCategory,
  attendees: number;
  capacity: number;
  isRegistered: boolean;
  organizer: string;
  description: string;
}

export interface EventDocument extends IEvent, Document {}
