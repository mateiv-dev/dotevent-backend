import { CreateRoleRequestDto } from '@dtos/RoleRequestDto';
import {
  RoleRequest,
  RoleRequestDocument,
  RoleRequestModel,
} from '@models/RoleRequest';
import { UserModel } from '@models/User';
import { AppError } from '@utils/AppError';
import { Role } from 'types/Role';
import { RoleRequestStatus } from 'types/RoleRequestStatus';

class UserRequestService {
  async getRoleRequests(): Promise<RoleRequestDocument[]> {
    const requests = await RoleRequestModel.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return requests;
  }

  async getUserRoleRequests(userId: string): Promise<RoleRequestDocument[]> {
    const user = await UserModel.findById(userId).select('_id').lean().exec();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const requests = await RoleRequestModel.find({ user: userId })
      .sort({
        createdAt: -1,
      })
      .lean();

    return requests;
  }

  async createRoleRequest(
    userId: string,
    incomingData: CreateRoleRequestDto,
  ): Promise<RoleRequestDocument> {
    const user = await UserModel.findById(userId).select('_id').lean().exec();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const requestPayload: Partial<RoleRequest> = {
      user: userId,
      requestedRole: incomingData.requestedRole,
      description: incomingData.description,
      status: RoleRequestStatus.PENDING,
    };

    switch (incomingData.requestedRole) {
      case Role.STUDENT_REP:
        if (!incomingData.university || !incomingData.represents) {
          throw new AppError(
            "Fields 'university' and 'represents' are required for Student Representatives.",
            400,
          );
        }
        requestPayload.university = incomingData.university;
        requestPayload.represents = incomingData.represents;
        break;

      case Role.ORGANIZER:
        if (!incomingData.organizationName) {
          throw new AppError(
            "Field 'organizationName' is required for Organizers.",
            400,
          );
        }
        requestPayload.organizationName = incomingData.organizationName;
        break;

      default:
        if (
          incomingData.requestedRole !== Role.STUDENT_REP &&
          incomingData.requestedRole !== Role.ORGANIZER
        ) {
          throw new AppError('Invalid role for request', 400);
        }
    }

    try {
      const newRequest = await RoleRequestModel.create(requestPayload);
      return newRequest;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError(
          'You already have a pending request. Please wait for the admin to review it.',
          409,
        );
      }
      throw error;
    }
  }

  async deleteRoleRequest(userId: string): Promise<void> {
    const roleRequest = await RoleRequestModel.findOneAndDelete({
      user: userId,
      status: RoleRequestStatus.PENDING,
    });

    if (!roleRequest) {
      throw new AppError('No pending role request found for this user.', 404);
    }
  }
}

export default new UserRequestService();
