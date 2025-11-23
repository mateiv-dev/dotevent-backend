import mongoose, { Schema } from 'mongoose';
import { UserDocument } from '../types/user';

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'student', 'student_rep', 'organizer', 'admin'],
      default: 'user',
    },
    university: {
      type: String,
      trim: true,
      required: function (this: UserDocument) {
        return this.role === 'student';
      },
    },
    represents: {
      type: String,
      trim: true,
      required: function (this: UserDocument) {
        return this.role === 'student_rep';
      },
    },
    organizationName: {
      type: String,
      trim: true,
      required: function (this: UserDocument) {
        return this.role === 'organizer';
      },
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre('save', function () {
  if (this.role === 'student' && !this.university) {
    throw new Error('University is required for students');
  } else if (this.role === 'student_rep' && !this.represents) {
    throw new Error('Represents field is required for student representatives');
  } else if (this.role === 'organizer' && !this.organizationName) {
    throw new Error('Organization name is required for organizers');
  }
});

export default mongoose.model<UserDocument>('User', UserSchema);