import {
  ResponseRoleRequestProccessedByDto,
  ResponseRoleRequestUserDto,
} from '@dtos/RoleRequestDto';
import mongoose, { HydratedDocument, InferSchemaType, Schema } from 'mongoose';
import { Role } from 'types/Role';
import { RoleRequestStatus } from 'types/RoleRequestStatus';

const RoleRequestSchema = new Schema(
  {
    user: {
      type: String,
      ref: 'User',
      required: true,
    },
    requestedRole: {
      type: String,
      required: true,
      trim: true,
      enum: [Role.ORGANIZER, Role.STUDENT_REP],
    },
    status: {
      type: String,
      trim: true,
      enum: Object.values(RoleRequestStatus),
      default: RoleRequestStatus.PENDING,
    },

    university: {
      type: String,
      trim: true,
      required: function (this: any) {
        return this.requestedRole === Role.STUDENT_REP;
      },
    },
    represents: {
      type: String,
      trim: true,
      required: function (this: any) {
        return this.requestedRole === Role.STUDENT_REP;
      },
    },
    organizationName: {
      type: String,
      trim: true,
      required: function (this: any) {
        return this.requestedRole === Role.ORGANIZER;
      },
    },

    description: {
      type: String,
      trim: true,
      required: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },
    proccessedBy: {
      type: String,
      ref: 'User',
    },
    proccessedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

RoleRequestSchema.index(
  { user: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: RoleRequestStatus.PENDING },
  },
);

export type RoleRequest = InferSchemaType<typeof RoleRequestSchema>;
export type RoleRequestDocument = HydratedDocument<RoleRequest>;

export type PopulatedRoleRequestDocument = HydratedDocument<RoleRequest> & {
  user: ResponseRoleRequestUserDto;
  proccessedBy?: ResponseRoleRequestProccessedByDto;
};

export const RoleRequestModel = mongoose.model<RoleRequestDocument>(
  'RoleRequest',
  RoleRequestSchema,
);
