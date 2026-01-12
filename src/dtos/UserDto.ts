import { UserDocument } from '@models/User';

export interface CreateUserDto {
  firebaseId: string;
  name: string;
  email: string;
}

export interface UpdateUserDto {
  name?: string;
  university?: string;
  represents?: string;
  organizationName?: string;
}

export class ResponseUserDto {
  // public id: string;
  public name: string;
  public email: string;
  public role: string;
  public university: string | null;
  public represents: string | null;
  public organizationName: string | null;

  constructor(user: UserDocument) {
    // this.id = user._id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;

    this.university = user.university ?? null;
    this.represents = user.represents ?? null;
    this.organizationName = user.organizationName ?? null;
  }

  static from(user: UserDocument | null): ResponseUserDto | null {
    if (!user) {
      return null;
    }
    return new ResponseUserDto(user);
  }

  static fromArray(users: UserDocument[]): ResponseUserDto[] {
    if (!users) {
      return [];
    }

    return users.map((user) => new ResponseUserDto(user));
  }
}
