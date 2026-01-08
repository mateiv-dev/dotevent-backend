import { ResponseRegistrationUserDto } from '@dtos/RegistrationDto';
import mongoose, { HydratedDocument, InferSchemaType, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { PopulatedEventDocument } from './Event';

const RegistrationSchema: Schema = new Schema(
  {
    user: {
      type: String,
      ref: 'User',
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    hasCheckedIn: {
      type: Boolean,
      default: false,
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      default: uuidv4,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

RegistrationSchema.index({ user: 1, event: 1 }, { unique: true });
RegistrationSchema.index({ reminderSent: 1 });
RegistrationSchema.index({ event: 1 });

export type Registration = InferSchemaType<typeof RegistrationSchema>;
export type RegistrationDocument = HydratedDocument<Registration>;

export type PopulatedRegistrationDocument = RegistrationDocument & {
  user: ResponseRegistrationUserDto;
  event: PopulatedEventDocument;
};

export const RegistrationModel = mongoose.model<RegistrationDocument>(
  'Registration',
  RegistrationSchema,
);
