import { Role } from "types/Role";

export interface CreateRoleRequestDto {
  requestedRole: Role;
  description: string;
  university?: string;
  represents?: string;
  organizationName?: string;
}
