import { CreateRoleRequestDto } from "@dtos/RoleRequestDto";
import { RoleRequestModel } from "@models/RoleRequest";
import { UserModel } from "@models/User";
import { AppError } from "@utils/AppError";
import { Role } from "types/Role";
import { RequestDocument } from "types/RoleRequest";

class UserRequestService {

  async getRequests(firebaseId: string): Promise<RequestDocument[]> {
    const user = await UserModel.findOne({ firebaseId: firebaseId });

    if (!user) {
      throw new AppError("User not found", 404);
    }
    
    const requests = await RoleRequestModel
        .find({ user: user._id })
        .sort({ createdAt: -1 });
    
    return requests;
  }

  async createRequest(firebaseId: string, incomingData: CreateRoleRequestDto): Promise<RequestDocument> {
    const user = await UserModel.findOne({ firebaseId: firebaseId });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const newRequestData: Partial<RequestDocument> = {
      user: user._id,
      requestedRole: incomingData.requestedRole,
      description: incomingData.description,
    };

    switch (newRequestData.requestedRole) {
      case Role.STUDENT_REP:
        if (!incomingData.university || !incomingData.represents) {
          throw new AppError('Fields \'university\' and \'represents\' are required', 400);
        }

        newRequestData.university = incomingData.university;
        newRequestData.represents = incomingData.represents;

        break;
      
      case Role.ORGANIZER:
        if (!incomingData.organizationName) {
          throw new AppError('Field \'organizationName\' is required', 400);
        }

        newRequestData.organizationName = incomingData.organizationName;

        break;

      default:
        throw new AppError("Invalid role", 400);
    }

    const newRequest = await RoleRequestModel.create(newRequestData);
    
    return newRequest;
  }
}

export default new UserRequestService();
