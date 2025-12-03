import firebase from "@config/firebase";
import { EventDocument, EventModel } from "@models/Event";
import { RoleRequestModel } from "@models/RoleRequest";
import { UserModel } from "@models/User";
import { AppError } from "@utils/AppError";
import { EventStatus } from "types/EventStatus";
import { Role } from "types/Role";
import { RequestDocument } from "types/RoleRequest";
import { RoleRequestStatus } from "types/RoleRequestStatus";

class AdminService {

  async getRequests(): Promise<RequestDocument[]> {
    const requests = await RoleRequestModel.find({
      status: RoleRequestStatus.PENDING
    }).exec();
    return requests;
  }

  async approveRoleRequest(id: string): Promise<RequestDocument> {
    const request = await RoleRequestModel.findById(id);

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    if (request.status !== RoleRequestStatus.PENDING) {
      throw new AppError('Request already processed', 409);
    }

    const existingUser = await UserModel.findById(request.user);

    if (!existingUser) {
      throw new AppError('User with ID from Request not found', 404);
    }

    const userObj = existingUser.toObject();

    let newUserData: any = {
      ...userObj,
      role: request.requestedRole,
      updatedAt: new Date()
    };

    if (request.requestedRole === Role.ORGANIZER) {
      newUserData.organizationName = request.organizationName;
    } 
    else if (request.requestedRole === Role.STUDENT_REP) {
      newUserData.university = request.university;
      newUserData.represents = request.represents;
    }

    await UserModel.findByIdAndDelete(existingUser._id);

    const [updatedUser] = await UserModel.create([newUserData]);

    if (!updatedUser) {
      throw new AppError('Failed to create updated user', 500);
    }

    await firebase.auth().setCustomUserClaims(updatedUser.firebaseId, { role: updatedUser.role });

    request.status = RoleRequestStatus.APPROVED;
    return await request.save();
  }

  async rejectRoleRequest(id: string, rejectionReason: string): Promise<RequestDocument> {
    const request = await RoleRequestModel.findById(id);

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    if (request.status !== RoleRequestStatus.PENDING) {
      throw new AppError('Request already processed', 409);
    }

    const existingUser = await UserModel.findById(request.user);

    if (!existingUser) {
      throw new AppError('User with ID from Request not found', 404);
    }

    request.rejectionReason = rejectionReason;
    request.status = RoleRequestStatus.REJECTED;

    return await request.save();
  }

  async approveEvent(id: String): Promise<EventDocument> {
    const event = await EventModel.findById(id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.status !== EventStatus.PENDING) {
      throw new AppError('Event already processed', 409);
    }

    event.status = EventStatus.APPROVED;

    return await event.save();
  }

  async rejectEvent(id: String, rejectionReason: string): Promise<EventDocument> {
    const event = await EventModel.findById(id);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.status !== EventStatus.PENDING) {
      throw new AppError('Event already processed', 409);
    }

    event.status = EventStatus.REJECTED;
    event.rejectionReason = rejectionReason;
    
    return await event.save();
  }
}

export default new AdminService();
