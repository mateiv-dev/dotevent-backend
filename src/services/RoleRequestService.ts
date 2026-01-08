import firebase from '@config/firebase';
import { CreateRoleRequestDto } from '@dtos/RoleRequestDto';
import {
  PopulatedRoleRequestDocument,
  RoleRequest,
  RoleRequestModel,
} from '@models/RoleRequest';
import { UserModel } from '@models/User';
import { AppError } from '@utils/AppError';
import { INotification } from 'types/INotification';
import { NotificationType } from 'types/NotificationType';
import { Role } from 'types/Role';
import { RoleRequestStatus } from 'types/RoleRequestStatus';
import NotificationService from './NotificationService';
import UserService from './UserService';

export const ROLE_REQUEST_POPULATE_OPTIONS = [
  { path: 'user', select: '-_id name email role' },
  { path: 'proccessedBy', select: '-_id name email' },
];

class RoleRequestService {
  async getRoleRequests(): Promise<PopulatedRoleRequestDocument[]> {
    const requests = await RoleRequestModel.find()
      .populate(ROLE_REQUEST_POPULATE_OPTIONS)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return requests as unknown as PopulatedRoleRequestDocument[];
  }

  async getUserRoleRequests(
    userId: string,
  ): Promise<PopulatedRoleRequestDocument[]> {
    const user = await UserModel.findById(userId).select('_id').lean().exec();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const requests = await RoleRequestModel.find({ user: userId })
      .sort({
        createdAt: -1,
      })
      .populate(ROLE_REQUEST_POPULATE_OPTIONS)
      .lean()
      .exec();

    return requests as unknown as PopulatedRoleRequestDocument[];
  }

  async createRoleRequest(
    userId: string,
    requestData: CreateRoleRequestDto,
  ): Promise<PopulatedRoleRequestDocument> {
    const user = await UserService.getUser(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (requestData.requestedRole === user.role) {
      throw new AppError('User already have this role', 409);
    }

    const requestPayload: Partial<RoleRequest> = {
      user: userId,
      requestedRole: requestData.requestedRole,
      description: requestData.description,
      status: RoleRequestStatus.PENDING,
    };

    switch (requestData.requestedRole) {
      case Role.STUDENT_REP:
        if (!requestData.university || !requestData.represents) {
          throw new AppError(
            "Fields 'university' and 'represents' are required for Student Representatives.",
            400,
          );
        }
        requestPayload.university = requestData.university;
        requestPayload.represents = requestData.represents;
        break;

      case Role.ORGANIZER:
        if (!requestData.organizationName) {
          throw new AppError(
            "Field 'organizationName' is required for Organizers.",
            400,
          );
        }
        requestPayload.organizationName = requestData.organizationName;
        break;

      default:
        if (
          requestData.requestedRole !== Role.STUDENT_REP &&
          requestData.requestedRole !== Role.ORGANIZER
        ) {
          throw new AppError('Invalid role for request', 400);
        }
    }

    try {
      const newRequest = await RoleRequestModel.create(requestPayload);

      const populated = await RoleRequestModel.findById(newRequest._id)
        .populate(ROLE_REQUEST_POPULATE_OPTIONS)
        .lean()
        .exec();

      return populated as unknown as PopulatedRoleRequestDocument;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError('You already have a pending request.', 409);
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

  async approveRoleRequest(
    adminId: string,
    requestId: string,
  ): Promise<PopulatedRoleRequestDocument> {
    const admin = await UserService.userExists(adminId);

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    const request = await RoleRequestModel.findById(requestId);

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    if (request.status !== RoleRequestStatus.PENDING) {
      throw new AppError('Request already processed', 409);
    }

    const user = await UserService.getUser(request.user);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userObject = user.toObject();

    let newUser: any = {
      ...userObject,
      role: request.requestedRole,
      updatedAt: new Date(),
    };

    if (request.requestedRole === Role.ORGANIZER) {
      newUser.organizationName = request.organizationName;
      newUser.university = undefined;
      newUser.represents = undefined;
    } else if (request.requestedRole === Role.STUDENT_REP) {
      newUser.university = request.university;
      newUser.represents = request.represents;
      newUser.organizationName = undefined;
    }

    await UserModel.findByIdAndDelete(user._id);

    const updatedUser = new UserModel(newUser);

    if (!updatedUser) {
      throw new AppError('Failed to create updated user', 500);
    }

    await updatedUser.save();

    await firebase
      .auth()
      .setCustomUserClaims(updatedUser._id, { role: updatedUser.role });

    request.status = RoleRequestStatus.APPROVED;
    request.proccessedBy = adminId;
    request.proccessedAt = new Date();

    const savedRequest = await request.save();

    await savedRequest.populate(ROLE_REQUEST_POPULATE_OPTIONS);

    const savedRequestObject = savedRequest.toObject();

    const notificationData: INotification = {
      user: updatedUser._id,
      title: 'Role Request Approved',
      message: `Your request for ${request.requestedRole.replace(
        '_',
        ' ',
      )} role has been approved!`,
      type: NotificationType.ROLE_APPROVED,
      relatedRequest: request._id.toString(),
    };

    await NotificationService.createNotification(notificationData);

    return savedRequestObject as unknown as PopulatedRoleRequestDocument;
  }

  async rejectRoleRequest(
    adminId: string,
    requestId: string,
    rejectionReason: string,
  ): Promise<PopulatedRoleRequestDocument> {
    const admin = UserService.userExists(adminId);

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    const request = await RoleRequestModel.findById(requestId);

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    if (request.status !== RoleRequestStatus.PENDING) {
      throw new AppError('Request already processed', 409);
    }

    const existingUser = await UserModel.findById(request.user);

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    request.rejectionReason = rejectionReason;
    request.status = RoleRequestStatus.REJECTED;
    request.proccessedBy = adminId;
    request.proccessedAt = new Date();

    const savedRequest = await request.save();

    await savedRequest.populate(ROLE_REQUEST_POPULATE_OPTIONS);

    const savedRequestObject = savedRequest.toObject();

    const notificationData: INotification = {
      user: existingUser._id,
      title: 'Role Request Rejected',
      message: `Your request for ${request.requestedRole.replace(
        '_',
        ' ',
      )} role has been rejected. Reason: ${rejectionReason}`,
      type: NotificationType.ROLE_REJECTED,
      relatedRequest: request._id.toString(),
    };

    await NotificationService.createNotification(notificationData);

    return savedRequestObject as unknown as PopulatedRoleRequestDocument;
  }
}

export default new RoleRequestService();
