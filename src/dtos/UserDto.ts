import { UserDocument } from 'types/User';

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
  // public uid: string;
  public name: string;
  public email: string;
  public role: string;
  public university?: string;
  public organizationName?: string;
  public represents?: string;

  constructor(testUser: any) {
    // this.uid = testUser.uid;
    this.name = testUser.name;
    this.email = testUser.email;
    this.role = testUser.role;

    if (testUser.university) this.university = testUser.university;
    if (testUser.organizationName)
      this.organizationName = testUser.organizationName;
    if (testUser.represents) this.represents = testUser.represents;
  }

  static from(testUser: UserDocument | null): ResponseUserDto | null {
    if (!testUser) {
      return null;
    }
    return new ResponseUserDto(testUser);
  }

  static fromArray(testUsers: UserDocument[]): ResponseUserDto[] {
    if (!testUsers) {
      return [];
    }

    return testUsers.map((user) => new ResponseUserDto(user));
  }
}
