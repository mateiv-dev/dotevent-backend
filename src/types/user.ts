import { Document, Types } from 'mongoose';

interface IBaseUser {
  name: string;
  email: string;
  role: 'user' | 'student' | 'student_rep' | 'organizer' | 'admin';
}

export interface IUser extends IBaseUser {
  university?: string;
  represents?: string;
  organizationName?: string;
}

export interface UserDocument extends IUser, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface INormalUser extends IBaseUser {
  role: 'user';
}

export interface IStudent extends IBaseUser {
  role: 'student';
  university: string;
}

export interface IStudentRep extends IBaseUser {
  role: 'student_rep';
  represents: string;
}

export interface IOrganizer extends IBaseUser {
  role: 'organizer';
  organizationName: string;
}

export interface IAdmin extends IBaseUser {
  role: 'admin';
}

export type UserType = INormalUser | IStudent | IStudentRep | IOrganizer | IAdmin;