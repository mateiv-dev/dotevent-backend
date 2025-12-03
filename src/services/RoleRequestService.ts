import { RoleRequestModel } from '@models/RoleRequest';
import { UserModel } from '@models/User';
import { AppError } from '@utils/AppError';
import { RoleRequestStatus } from 'types/RoleRequestStatus';
import { Role } from 'types/Role';
import { z } from 'zod';

const organizerPayloadSchema = z.object({
  organizationName: z.string().min(2)
});

const studentRepPayloadSchema = z.object({
  university: z.string().min(2),
  represents: z.string().min(2)
});

class RoleRequestService {
  async createRequest(userId: string, requestedRole: Role, payload: any) {
    const user = await UserModel.findById(userId).exec();

    if (!user) {
      throw new AppError("User not found in database.", 404);
    }

    if (user.role === requestedRole) {
      throw new AppError(`You are already a ${requestedRole}.`, 400);
    }

    const existingPendingRequest = await RoleRequestModel.findOne({ 
      user: userId, 
      status: RoleRequestStatus.PENDING 
    });

    if (existingPendingRequest) {
      throw new AppError("You already have an active request pending approval.", 400);
    }

    this.validatePayload(requestedRole, payload);

    return await RoleRequestModel.create({
      user: userId,
      requestedRole,
      payload
    });
  }

  async approveRequest(requestId: string) {
    const request = await RoleRequestModel.findById(requestId);
    
    if (!request) {
      throw new AppError("Request not found.", 404);
    }
    
    if (request.status !== RoleRequestStatus.PENDING) {
      throw new AppError(`Request is already ${request.status}.`, 400);
    }

    const updateData = {
      role: request.requestedRole,
      ...request.payload
    };

    const updatedUser = await UserModel.findByIdAndUpdate(
      request.user,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedUser) {
      throw new AppError("User associated with this request was not found.", 404);
    }

    request.status = RoleRequestStatus.APPROVED;
    await request.save();

    // Send Email

    return updatedUser;
  }

  async rejectRequest(requestId: string, reason: string) {
    const request = await RoleRequestModel.findById(requestId);
    if (!request || request.status !== RoleRequestStatus.PENDING) {
        throw new AppError("Request not found or already processed.", 404);
    }
    
    request.status = RoleRequestStatus.REJECTED;
    request.rejectionReason = reason;

    return await request.save();
  }

  private validatePayload(role: Role, data: any) {
    try {
      switch (role) {
        case Role.ORGANIZER:
          organizerPayloadSchema.parse(data);
          break;

        case Role.STUDENT_REP:
          studentRepPayloadSchema.parse(data);
          break;

        default:
          throw new AppError("Cannot request this role via this endpoint.", 400);
      }
    } 
    catch (error) {
      throw new AppError("Invalid data provided for this role.", 400);
    }
  }
}
