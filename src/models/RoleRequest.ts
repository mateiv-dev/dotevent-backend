import mongoose, { Schema, Types } from 'mongoose';
import { Role } from 'types/Role';
import { RoleRequestStatus } from 'types/RoleRequestStatus';
import { RequestDocument } from 'types/RoleRequest';

const roleRequestSchema = new Schema<RequestDocument>({
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true
    },
    requestedRole: {
      type: String,
      required: true,
      trim: true,
      enum: [Role.ORGANIZER, Role.STUDENT_REP] 
    },
    status: { 
      type: String,
      trim: true, 
      enum: Object.values(RoleRequestStatus), 
      default: RoleRequestStatus.PENDING
    },
    university: {
      type: String,
      trim: true, 
      required: function() { return this.requestedRole === Role.STUDENT_REP; }
    },
    represents: {
      type: String,
      trim: true,
      required: function() { return this.requestedRole === Role.STUDENT_REP; }
    },
    organizationName: {
      type: String,
      trim: true,
      required: function() { return this.requestedRole === Role.ORGANIZER; }
    },
    description: {
      type: String,
      trim: true,
      required: true
    },
    rejectionReason: { 
      type: String,
      trim: true
    }
  },
  { 
    timestamps: true
  }
);

roleRequestSchema.index(
  { user: 1, status: 1 }, 
  { unique: true, partialFilterExpression: { status: RoleRequestStatus.PENDING } }
);

export const RoleRequestModel = mongoose.model('RoleRequest', roleRequestSchema);
