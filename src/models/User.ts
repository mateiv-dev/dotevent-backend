import mongoose, { HydratedDocument, InferSchemaType, Schema } from 'mongoose';
import { EventCategory } from 'types/EventCategory';
import { Role } from 'types/Role';

const UserSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: [2, "'name' must contain 2 or more characters."],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.SIMPLE_USER,
    },
    university: {
      type: String,
      trim: true,
      required: function (this: any) {
        return [Role.STUDENT, Role.STUDENT_REP].includes(this.role);
      },
    },
    represents: {
      type: String,
      trim: true,
      required: function (this: any) {
        return this.role === Role.STUDENT_REP;
      },
    },
    organizationName: {
      type: String,
      trim: true,
      required: function (this: any) {
        return this.role === Role.ORGANIZER;
      },
    },

    preferences: {
      notifications: {
        eventUpdated: { type: Boolean, default: true },
        eventReminder: { type: Boolean, default: true },
      },
      emails: {
        eventUpdated: { type: Boolean, default: true },
        eventReminder: { type: Boolean, default: true },
      },

      eventCategories: {
        type: [String],
        enum: Object.values(EventCategory),
        default: [],
      },
      organizers: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
    collection: 'users',
    // _id: false,
  },
);

export type User = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<User>;

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
