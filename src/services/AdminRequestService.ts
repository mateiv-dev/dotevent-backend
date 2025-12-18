import firebase from "@config/firebase";
import { EventDocument, EventModel } from "@models/Event";
import { RoleRequestModel } from "@models/RoleRequest";
import { UserModel } from "@models/User";
import { AppError } from "@utils/AppError";
import { EventStatus } from "types/EventStatus";
import { Role } from "types/Role";
import { RequestDocument } from "types/RoleRequest";
import { RoleRequestStatus } from "types/RoleRequestStatus";
import NotificationService from "@services/NotificationService";

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
    const savedRequest = await request.save();

    await NotificationService.createNotification(
      updatedUser.firebaseId,
      'Role Request Approved',
      `Your request for ${request.requestedRole.replace('_', ' ')} role has been approved!`,
      'role_approved',
      undefined,
      request._id.toString()
    );

    return savedRequest;
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

    const savedRequest = await request.save();

    await NotificationService.createNotification(
      existingUser.firebaseId,
      'Role Request Rejected',
      `Your request for ${request.requestedRole.replace('_', ' ')} role has been rejected. Reason: ${rejectionReason}`,
      'role_rejected',
      undefined,
      request._id.toString()
    );

    return savedRequest;
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

    const savedEvent = await event.save();

    const creator = await UserModel.findOne({ name: event.organizer });
    if (creator) {
      await NotificationService.createNotification(
        creator.firebaseId,
        'Event Approved',
        `Your event "${event.title}" has been approved!`,
        'event_approved',
        event._id.toString()
      );
    }

    return savedEvent;
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

    const savedEvent = await event.save();

    const creator = await UserModel.findOne({ name: event.organizer });
    if (creator) {
      await NotificationService.createNotification(
        creator.firebaseId,
        'Event Rejected',
        `Your event "${event.title}" has been rejected. Reason: ${rejectionReason}`,
        'event_rejected',
        event._id.toString()
      );
    }

    return savedEvent;
  }
}

export default new AdminService();
