import { PopulatedRoleRequestDocument } from '@models/RoleRequest';
import { Role } from 'types/Role';

export interface CreateRoleRequestDto {
  requestedRole: Role.STUDENT_REP | Role.ORGANIZER;
  description: string;
  university?: string;
  represents?: string;
  organizationName?: string;
}

export interface ResponseRoleRequestUserDto {
  name: string;
  email: string;
  role: string;
}

export interface ResponseRoleRequestProccessedByDto {
  name: string;
  email: string;
}

export class ResponseRoleRequestDto {
  public user: ResponseRoleRequestUserDto;
  public id: string;
  public requestedRole: string;
  public status: string;
  public description: string;
  public createdAt: Date;

  public university: string | null;
  public represents: string | null;
  public organizationName: string | null;
  public rejectionReason: string | null;
  public proccessedBy: ResponseRoleRequestProccessedByDto | null;
  public proccessedAt: Date | null;

  constructor(roleRequest: PopulatedRoleRequestDocument) {
    const userData: ResponseRoleRequestUserDto = {
      name: roleRequest.user.name,
      email: roleRequest.user.email,
      role: roleRequest.user.role,
    };

    this.user = userData;
    this.id = roleRequest._id.toString();
    this.requestedRole = roleRequest.requestedRole;
    this.status = roleRequest.status;
    this.description = roleRequest.description;
    this.createdAt = roleRequest.createdAt;

    if (roleRequest.requestedRole === Role.STUDENT_REP) {
      this.university = roleRequest.university ?? null;
      this.represents = roleRequest.represents ?? null;
      this.organizationName = null;
    } else if (roleRequest.requestedRole === Role.ORGANIZER) {
      this.university = null;
      this.represents = null;
      this.organizationName = roleRequest.organizationName ?? null;
    } else {
      this.university = null;
      this.represents = null;
      this.organizationName = null;
    }

    this.rejectionReason = roleRequest.rejectionReason ?? null;

    if (roleRequest.proccessedBy) {
      const proccessedBy: ResponseRoleRequestProccessedByDto = {
        name: roleRequest.proccessedBy.name,
        email: roleRequest.proccessedBy.email,
      };

      this.proccessedBy = proccessedBy ?? null;
    } else {
      this.proccessedBy = null;
    }

    this.proccessedAt = roleRequest.proccessedAt ?? null;
  }

  static from(
    roleRequest: PopulatedRoleRequestDocument,
  ): ResponseRoleRequestDto | null {
    if (!roleRequest) {
      return null;
    }

    return new ResponseRoleRequestDto(roleRequest);
  }

  static fromArray(
    roleRequests: PopulatedRoleRequestDocument[],
  ): ResponseRoleRequestDto[] | null {
    if (!roleRequests) {
      return null;
    }

    return roleRequests.map((request) => new ResponseRoleRequestDto(request));
  }
}
