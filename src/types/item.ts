import { Document, Types } from 'mongoose';

export interface IItem {
  name: string;
  description?: string;
}

export interface ItemDocument extends IItem, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}