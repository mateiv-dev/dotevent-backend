import mongoose, { Schema } from 'mongoose';
import { Role } from 'types/Role';
import {
  IAdmin,
  IOrganizer,
  IStudent,
  IStudentRep,
  IUserBase,
  UserDocument,
} from 'types/User';

const baseUserSchema = new Schema<UserDocument>(
  {
    firebaseId: {
      type: String,
      required: true,
      trim: true,
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
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
    collection: 'users',
  },
);

export const UserModel = mongoose.model<UserDocument>('User', baseUserSchema);

const simpleUserDiscriminatorSchema = new Schema<IUserBase>({});

export const SimpleUserModel = UserModel.discriminator<IUserBase>(
  Role.SIMPLE_USER,
  simpleUserDiscriminatorSchema,
);

const studentSchema = new Schema<IStudent>({
  university: {
    type: String,
    required: true,
  },
});

export const StudentModel = UserModel.discriminator<IStudent>(
  Role.STUDENT,
  studentSchema,
);

const studentRepSchema = new Schema<IStudentRep>({
  university: {
    type: String,
    required: true,
  },
  represents: {
    type: String,
    required: true,
  },
});

export const StudentRepModel = UserModel.discriminator<IStudentRep>(
  Role.STUDENT_REP,
  studentRepSchema,
);

const organizerSchema = new Schema<IOrganizer>({
  organizationName: {
    type: String,
    required: true,
  },
});

export const OrganizerModel = UserModel.discriminator<IOrganizer>(
  Role.ORGANIZER,
  organizerSchema,
);

const adminSchema = new Schema<IAdmin>();

export const AdminModel = UserModel.discriminator<IAdmin>(
  Role.ADMIN,
  adminSchema,
);
