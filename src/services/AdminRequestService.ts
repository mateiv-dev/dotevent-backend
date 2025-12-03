import firebase from "@config/firebase";
import { RoleRequestModel } from "@models/RoleRequest";
import { UserModel } from "@models/User";
import { AppError } from "@utils/AppError";
import { Role } from "types/Role";
import { RequestDocument } from "types/RoleRequest";
import { RoleRequestStatus } from "types/RoleRequestStatus";

class AdminRequestService {

  async getRequests(): Promise<RequestDocument[]> {
    const requests = await RoleRequestModel.find();
    return requests;
  }

  async approveRequest(id?: string): Promise<RequestDocument> {
    if (!id) throw new AppError('ID required', 400);

    const request = await RoleRequestModel.findById(id);
    if (!request || request.status !== RoleRequestStatus.PENDING) {
      throw new AppError('Invalid request', 400);
    }

    const existingUser = await UserModel.findById(request.user);
    if (!existingUser) throw new AppError('User not found', 404);

    let newUserData: any = {
      _id: existingUser._id,
      firebaseId: existingUser.firebaseId,
      name: existingUser.name,
      email: existingUser.email,
      role: request.requestedRole,
      createdAt: existingUser.createdAt,
      updatedAt: new Date()
    };

    if (request.requestedRole === Role.ORGANIZER) {
      newUserData.organizationName = request.organizationName;
    } else if (request.requestedRole === Role.STUDENT_REP) {
      newUserData.university = request.university;
      newUserData.represents = request.represents;
    }

    await UserModel.findByIdAndDelete(existingUser._id);

    const [updatedUser] = await UserModel.create([newUserData]);

    if (!updatedUser) throw new AppError('Failed to create updated user', 500);

    await firebase.auth().setCustomUserClaims(updatedUser.firebaseId, { role: updatedUser.role });

    request.status = RoleRequestStatus.APPROVED;
    return await request.save();
  }
}

export default new AdminRequestService();
