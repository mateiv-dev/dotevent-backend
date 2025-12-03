import firebase from '@config/firebase';
import { CreateUserDto, UpdateUserDto } from '@dtos/UserDto';
import { AdminModel, UserModel } from '@models/User';
import { AppError } from '@utils/AppError';
import { Role } from 'types/Role';
import { UserDocument } from 'types/User';

class UserService {

  async getUsers(): Promise<UserDocument[]> {
    return await UserModel.find({
      role: { $ne: Role.ADMIN } 
    }).exec();
  }

  async getUser(id: string): Promise<UserDocument | null> {
    const user = await UserModel.findById(id).exec();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
  
  async getMe(firebaseId: string): Promise<UserDocument | null> {
    const user = await UserModel.findOne({ firebaseId: firebaseId }).exec();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await firebase.auth().setCustomUserClaims(firebaseId, { role: user.role });

    return user;
  }

  async createUser(userData: CreateUserDto, adminKey: string): Promise<UserDocument> {
    if (adminKey !== undefined) {
      if (!adminKey || adminKey.trim().length === 0) {
        throw new AppError('Admin secret key cannot be empty.', 400);
      }
      else if (adminKey.trim() !== process.env.ADMIN_KEY) {
        throw new AppError('Incorect admin secret key', 403);
      }
      else {
        const existedAdmin = await UserModel.exists({ role: Role.ADMIN });

        if (existedAdmin) {
          throw new AppError('Admin already exists', 409);
        }

        const newAdmin = new AdminModel({
          ...userData,
          role: Role.ADMIN
        });
        
        await firebase.auth().setCustomUserClaims(newAdmin.firebaseId, { role: Role.ADMIN });

        return await newAdmin.save();
      }
    }
    else {
      const newUser = new UserModel(userData);
      await firebase.auth().setCustomUserClaims(newUser.firebaseId, { role: Role.SIMPLE_USER });
      return await newUser.save();
    }
  }

  async deleteUser(id: string): Promise<UserDocument | null> {
    const user = await UserModel.findByIdAndDelete(id).exec();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
  
  async deleteMe(id: string): Promise<UserDocument | null> {
    await firebase.auth().deleteUser(id);
    return await UserModel.findOneAndDelete({ firebaseId: id }).exec();
  }

  async updateUser(id: string, incomingData: UpdateUserDto) {
    if (!incomingData) {
      throw new AppError('Invalid input data', 400);
    }

    const user = await UserModel.findOne({ firebaseId: id });
    
    if (!user) {
      throw new AppError("User not found", 404);
    }
    
    let allowedFields = {};

    switch (user.role) {
      case Role.SIMPLE_USER:
        allowedFields = {
          name: incomingData.name
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
          represents: incomingData
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

  async syncEmail(firebaseId: string, newEmail: string): Promise<UserDocument> {
    const user = await UserModel.findOne({ firebaseId: firebaseId });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.email === newEmail) {
      return user;
    }

    user.email = newEmail;

    return user.save();
  }
}

export default new UserService();
