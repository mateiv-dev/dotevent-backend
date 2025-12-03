import { Document, Types } from 'mongoose';
import { Role } from './Role';

export interface CreateUserDto {
  name: string;
  email: string;
}

interface BaseUser {
  name: string;
  email: string;
  role: Role;
}

export interface User extends BaseUser {
  university?: string;
  represents?: string;
  organizationName?: string;
}

export interface UserDocument extends User, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface NormalUser extends BaseUser {
  role: Role.SIMPLE_USER;
}

export interface Student extends BaseUser {
  role: Role.STUDENT_REP;
  university: string;
}

export interface StudentRep extends BaseUser {
  role: Role.STUDENT_REP;
  represents: string;
}

export interface Organizer extends BaseUser {
  role: Role.ORGANIZER;
  organizationName: string;
}

export interface Admin extends BaseUser {
  role: Role.ADMIN;
}

export type UserType = NormalUser | Student | StudentRep | Organizer | Admin;
