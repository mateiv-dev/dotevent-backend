import firebase from '@config/firebase';
import { CreateUserDto, UpdateUserDto } from '@dtos/UserDto';
import { UserDocument, UserModel } from '@models/User';
import { AppError } from '@utils/AppError';
import { UNIVERSITY_DOMAINS } from '@utils/universities';
import { Role } from 'types/Role';

const studentDomainRegex = /^[a-zA-Z0-9._%+-]+@student\.([a-zA-Z0-9-]+)\.ro$/;

class UserService {
  async getUsers(): Promise<UserDocument[]> {
    return await UserModel.find({
      role: { $ne: Role.ADMIN },
    })
      .lean()
      .exec();
  }

  async getUser(id: string): Promise<UserDocument | null> {
    const user = await UserModel.findById(id).exec();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // await firebase.auth().setCustomUserClaims(id, { role: user.role });

    return user;
  }

  async userExists(id: string): Promise<boolean> {
    const user = await UserModel.findById(id).select('_id').lean().exec();

    if (user) {
      return true;
    }

    return false;
  }

  async createUser(
    userData: CreateUserDto,
    adminKey?: string,
  ): Promise<UserDocument> {
    const { firebaseId } = userData;
    let roleToAssign = Role.SIMPLE_USER;
    let university: string | undefined = undefined;

    if (adminKey !== undefined && adminKey !== null) {
      if (adminKey.trim().length === 0) {
        throw new AppError('Invalid admin secret key', 400);
      }

      if (adminKey.trim() !== process.env.ADMIN_KEY) {
        throw new AppError('Incorrect admin secret key', 403);
      }

      roleToAssign = Role.ADMIN;
    }

    const match = userData.email.toLowerCase().match(studentDomainRegex);

    if (roleToAssign !== Role.ADMIN && match) {
      const domainKey = match[1];

      if (domainKey) {
        roleToAssign = Role.STUDENT;

        const universityName = UNIVERSITY_DOMAINS[domainKey];

        university = universityName ? universityName : domainKey.toUpperCase();
      }
    }

    const newUser = new UserModel({
      _id: firebaseId,
      email: userData.email,
      name: userData.name,
      role: roleToAssign,
      university: university,
    });

    await newUser.save();

    try {
      await firebase
        .auth()
        .setCustomUserClaims(firebaseId, { role: roleToAssign });
    } catch (firebaseError) {
      await UserModel.findByIdAndDelete(firebaseId);
      throw new AppError('Failed to set user claims on Firebase.', 500);
    }

    return newUser;
  }

  async deleteUser(id: string): Promise<UserDocument | null> {
    const user = UserModel.findByIdAndDelete(id).lean().exec();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await firebase.auth().deleteUser(id);

    return user;
  }

  async updateUser(id: string, incomingData: UpdateUserDto) {
    if (!incomingData) {
      throw new AppError('Invalid input data', 400);
    }

    const user = await UserModel.findOne({ firebaseId: id });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    let allowedFields = {};

    switch (user.role) {
      case Role.SIMPLE_USER:
        allowedFields = {
          name: incomingData.name,
        };
        break;

      case Role.STUDENT:
        allowedFields = {
          name: incomingData.name,
          university: incomingData.university,
        };
        break;

      case Role.STUDENT_REP:
        allowedFields = {
          name: incomingData.name,
          university: incomingData.university,
          represents: incomingData.represents,
        };

        break;

      case Role.ORGANIZER:
        allowedFields = {
          name: incomingData.name,
          organizationName: incomingData.organizationName,
        };

        break;

      default:
        allowedFields = { name: incomingData.name };
    }

    const finalUpdateData = JSON.parse(JSON.stringify(allowedFields));
    Object.assign(user, finalUpdateData);

    return await user.save();
  }

  async syncEmail(id: string, newEmail: string): Promise<UserDocument> {
    const user = await UserModel.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.email === newEmail) {
      return user;
    }

    user.email = newEmail;

    return user.save();
  }
}

export default new UserService();
