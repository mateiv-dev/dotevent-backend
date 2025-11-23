import { Document, Types } from 'mongoose';

export interface IEvent {
  title: string;
  date: Date;
  time: string;
  location: string;
  category: 'Academic' | 'Social' | 'Career' | 'Sports';
  attendees: number;
  capacity: number;
  isRegistered: boolean;
  organizer: string;
  description: string;
}

export interface EventDocument extends IEvent, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}