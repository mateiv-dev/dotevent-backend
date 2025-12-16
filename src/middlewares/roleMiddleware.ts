import { Request, Response, NextFunction } from "express";
import { asyncErrorHandler } from "./errorMiddleware";
import { Role } from "types/Role";
import { AppError } from "@utils/AppError";

export const requireRoles = (allowedRoles: Role[]) => 
  asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {  
    // const firebaseId = req.user!.uid;
    // const user = await UserService.getMe(firebaseId);

    // if (!user) {
    //   throw new AppError('User not found', 404);
    // }

    const role = req.user?.role;

    if (!role) {
      throw new AppError('Role is missing from user token.', 403);
    }

    if (!allowedRoles.includes(role)) {
      // throw new AppError('Forbidden: This resource requires special privileges.', 403);
      const requiredRolesString = allowedRoles.join(', ');
      const errorMessage = `Forbidden: This resource requires one of the following roles: ${requiredRolesString}.`;
      throw new AppError(errorMessage, 403);
    }

    next();
  });
