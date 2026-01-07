import mongoose, { HydratedDocument, InferSchemaType, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const RegistrationSchema: Schema = new Schema(
  {
    user: {
      type: String,
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

export type Registration = InferSchemaType<typeof RegistrationSchema>;
export type RegistrationDocument = HydratedDocument<Registration>;

export const RegistrationModel = mongoose.model<RegistrationDocument>(
  'Registration',
  RegistrationSchema,
);
