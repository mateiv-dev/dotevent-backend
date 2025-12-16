import firebase from '@config/firebase';
import { CreateUserDto, UpdateUserDto } from '@dtos/UserDto';
import { UserModel } from '@models/User';
import { AppError } from '@utils/AppError';
import { Role } from 'types/Role';
import { UserDocument } from 'types/User';

interface UniversityMap {
  [key: string]: string;
}

export const UNIVERSITY_DOMAINS: UniversityMap = {
  "usv": "Universitatea Ștefan cel Mare din Suceava",
  "ase": "Academia de Studii Economice din București",
  "poli": "Universitatea Politehnica din București",
  "ubb": "Universitatea Babeș-Bolyai din Cluj-Napoca",
};

const studentDomainRegex = /^[a-zA-Z0-9._%+-]+@student\.([a-zA-Z0-9-]+)\.ro$/;

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

  async createUser(userData: CreateUserDto, adminKey?: string): Promise<UserDocument> {
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

      const existedAdmin = await UserModel.exists({ role: Role.ADMIN });

      if (existedAdmin) {
        throw new AppError('Admin already exists', 409);
      }
      
      roleToAssign = Role.ADMIN;
    }

    const match = userData.email.toLowerCase().match(studentDomainRegex);

    if (roleToAssign !== Role.ADMIN && match) {
      const domainKey = match[1];

      if (domainKey) { 
        roleToAssign = Role.STUDENT; 

        const universityName = UNIVERSITY_DOMAINS[domainKey];
        
        university = universityName 
          ? universityName 
          : domainKey.toUpperCase();
      }
    }

    const newUser = await UserModel.create({
      ...userData,
      role: roleToAssign,
      university: university,
    });

    try {
      await firebase.auth().setCustomUserClaims(firebaseId, { role: roleToAssign });
    } 
    catch (firebaseError) {
      await UserModel.deleteOne({ firebaseId }); 
      throw new AppError('Failed to set user claims on Firebase.', 500);
    }

    return newUser;
  }
  
  async deleteUser(id: string): Promise<UserDocument | null> {
    const user = UserModel.findOneAndDelete({ firebaseId: id }).exec();
    
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
