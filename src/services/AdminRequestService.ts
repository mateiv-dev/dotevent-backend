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
    
    let updateData = {};
    let unsetData = {};

    if (request.requestedRole === Role.ORGANIZER) {
        updateData = {
            role: Role.ORGANIZER,
            organizationName: request.organizationName
        };
        unsetData = { university: 1, represents: 1 };

    } else if (request.requestedRole === Role.STUDENT_REP) {
        updateData = {
            role: Role.STUDENT_REP,
            university: request.university,
            represents: request.represents
        };
        unsetData = { organizationName: 1 };
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
        request.user,
        { 
            $set: updateData,
            $unset: unsetData
        },
        { 
            new: true,
            runValidators: true
        }
    );

    if (!updatedUser) throw new AppError('User not found', 404);

    await firebase.auth().setCustomUserClaims(updatedUser.firebaseId, { role: updatedUser.role });

    request.status = RoleRequestStatus.APPROVED;
    return await request.save();
  }
}

export default new AdminRequestService();
