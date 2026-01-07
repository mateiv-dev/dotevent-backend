import { Role } from 'types/Role';

export interface CreateRoleRequestDto {
  requestedRole: Role.STUDENT_REP | Role.ORGANIZER;
  description: string;
  university?: string;
  represents?: string;
  organizationName?: string;
}
