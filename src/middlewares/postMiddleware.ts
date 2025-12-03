import { Request, Response, NextFunction } from "express";
import { asyncErrorHandler } from "./errorMiddleware";
import { Role } from "types/Role";
import { AppError } from "@utils/AppError";
import UserService from "@services/UserService";

export const requirePostPermission = asyncErrorHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const firebaseId = req.user!.uid;
  const user = await UserService.getMe(firebaseId);

  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  if (user.role !== Role.STUDENT_REP && 
      user.role !== Role.ORGANIZER) {
    throw new AppError('Forbidden: This resource requires post privileges.', 403);
  }

  // if (req.user!.role !== Role.STUDENT_REP && 
  //     req.user!.role !== Role.ORGANIZER) {
  //   throw new AppError('Forbidden: This resource requires post privileges.', 403);
  // }

  next();
});
