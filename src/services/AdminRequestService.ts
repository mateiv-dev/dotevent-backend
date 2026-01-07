import firebase from '@config/firebase';
import { EventDocument, EventModel } from '@models/Event';
import { RoleRequestDocument, RoleRequestModel } from '@models/RoleRequest';
import { UserModel } from '@models/User';
import NotificationService from '@services/NotificationService';
import { AppError } from '@utils/AppError';
import { CreateNotification } from 'types/CreateNotification';
import { EventStatus } from 'types/EventStatus';
import { NotificationType } from 'types/NotificationType';
import { Role } from 'types/Role';
import { RoleRequestStatus } from 'types/RoleRequestStatus';
import UserService from './UserService';

class AdminService {
  async getRoleRequests(): Promise<RoleRequestDocument[]> {
    const requests = await RoleRequestModel.find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return requests;
  }

  async approveRoleRequest(
    adminId: string,
    requestId: string,
  ): Promise<RoleRequestDocument> {
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
      throw new AppError('User with ID from Request not found', 404);
    }

    const userObj = existingUser.toObject();

    let newUserData: any = {
      ...userObj,
      role: request.requestedRole,
      updatedAt: new Date(),
    };

    if (request.requestedRole === Role.ORGANIZER) {
      newUserData.organizationName = request.organizationName;
    } else if (request.requestedRole === Role.STUDENT_REP) {
      newUserData.university = request.university;
      newUserData.represents = request.represents;
    }

    await UserModel.findByIdAndDelete(existingUser._id);

    const [updatedUser] = await UserModel.create([newUserData]);

    if (!updatedUser) {
      throw new AppError('Failed to create updated user', 500);
    }

    await firebase
      .auth()
      .setCustomUserClaims(updatedUser._id, { role: updatedUser.role });

    request.status = RoleRequestStatus.APPROVED;
    request.proccessedBy = adminId;
    const savedRequest = await request.save();

    const notificationData: CreateNotification = {
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

    return savedRequest;
  }

  async rejectRoleRequest(
    adminId: string,
    requestId: string,
    rejectionReason: string,
  ): Promise<RoleRequestDocument> {
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
      throw new AppError('User with ID from Request not found', 404);
    }

    request.rejectionReason = rejectionReason;
    request.status = RoleRequestStatus.REJECTED;
    request.proccessedBy = adminId;

    const savedRequest = await request.save();

    const notificationData: CreateNotification = {
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

    return savedRequest;
  }

  async approveEvent(adminId: string, eventId: String): Promise<EventDocument> {
    const event = await EventModel.findById(eventId);

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
      const notificationData: CreateNotification = {
        user: creator._id,
        title: 'Event Approved',
        message: `Your event "${event.title}" has been approved!`,
        type: NotificationType.EVENT_APPROVED,
        relatedEvent: event._id.toString(),
      };

      await NotificationService.createNotification(notificationData);
    }

    return savedEvent;
  }

  async rejectEvent(
    adminId: string,
    eventId: String,
    rejectionReason: string,
  ): Promise<EventDocument> {
    const event = await EventModel.findById(eventId);

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
      const notificationData: CreateNotification = {
        user: creator._id,
        title: 'Event Rejected',
        message: `Your event "${event.title}" has been rejected. Reason: ${rejectionReason}`,
        type: NotificationType.EVENT_REJECTED,
        relatedEvent: event._id.toString(),
      };

      await NotificationService.createNotification(notificationData);
    }

    return savedEvent;
  }
}

export default new AdminService();
