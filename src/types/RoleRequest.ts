import { Types } from "mongoose";
import { Role } from "./Role";
import { RoleRequestStatus } from "./RoleRequestStatus";

export interface RequestDocument extends Document {
  user: Types.ObjectId; 

  requestedRole: Role;
  status: RoleRequestStatus;

  university?: string;
  represents?: string;
  organizationName?: string;
  
  description: string;
  rejectionReason?: string; 

  createdAt: Date;
  updatedAt: Date;
}
