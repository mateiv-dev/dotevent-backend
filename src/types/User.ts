import { Types } from "mongoose";
import { Role } from "./Role";

export interface IUserBase extends Document {
  _id: Types.ObjectId;
  firebaseId: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudent extends IUserBase {
  role: Role.STUDENT;
  university: string;
}

export interface IStudentRep extends IUserBase {
  role: Role.STUDENT_REP;
  university: string;
  represents: string;
}

export interface IOrganizer extends IUserBase {
  role: Role.ORGANIZER;
  organizationName: string;
}

export interface IAdmin extends IUserBase {
  role: Role.ADMIN;
}

export type UserDocument = IUserBase | IStudent | IStudentRep | IOrganizer | IAdmin;
