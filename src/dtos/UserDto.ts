import { UserDocument } from '@models/User';

export interface CreateUserDto {
  firebaseId: string;
  name: string;
  email: string;
}

export interface UpdateUserDto {
  name?: string;
  university?: string;
  organizationName?: string;
  represents?: string;
}

export interface ReviewUserDto {
  name: string;
}

export class ResponseUserDto {
  // public id: string;
  public name: string;
  public email: string;
  public role: string;
  public university?: string;
  public organizationName?: string;
  public represents?: string;

  constructor(user: UserDocument) {
    // this.id = user._id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;

    if (user.university) this.university = user.university;
    if (user.organizationName) this.organizationName = user.organizationName;
    if (user.represents) this.represents = user.represents;
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
