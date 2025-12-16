import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface RegistrationDocument extends Document {
  user: string;
  event: mongoose.Types.ObjectId;
  hasCheckedIn: boolean;
  ticketCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema: Schema = new Schema({
  user: { 
    type: String,
    required: true 
  },
  event: { 
    type: Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  hasCheckedIn: { 
    type: Boolean, 
    default: false 
  },
  ticketCode: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
  },
},
  {
    timestamps: true 
  }
);

RegistrationSchema.index({ user: 1, event: 1 }, { unique: true });

export const RegistrationModel = mongoose.model<RegistrationDocument>('Registration', RegistrationSchema);
