import mongoose, { Schema } from 'mongoose';
import { ItemDocument } from '../types/item';

const ItemSchema = new Schema<ItemDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ItemDocument>('Item', ItemSchema);