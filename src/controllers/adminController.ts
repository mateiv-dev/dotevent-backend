import { Request, Response } from "express";
import { asyncErrorHandler } from "@middlewares/errorMiddleware";
import AdminService from "@services/AdminRequestService";
import { AppError } from "@utils/AppError";

export const getRequests = asyncErrorHandler(async (_req: Request, res: Response) => {
  const requests = await AdminService.getRequests();
  res.status(200).json(requests);
});

export const approveRequest = asyncErrorHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id?.trim().length === 0) {
    throw new AppError('Parameter \'id\' is required', 400);
  }

  const request = await AdminService.approveRoleRequest(id);
  res.status(200).json(request);
});

export const rejectRequest = asyncErrorHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id?.trim().length === 0) {
    throw new AppError('Parameter \'id\' is required', 400);
  }

  const { rejectionReason } = req.body || {};

  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw new AppError('Field \'rejectionReason\' is required', 400);
  }

  const request = await AdminService.rejectRoleRequest(id, rejectionReason);
  res.status(200).json(request);
});

export const approveEvent = asyncErrorHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id?.trim().length === 0) {
    throw new AppError('Parameter \'id\' is required', 400);
  }

  const request = await AdminService.approveEvent(id);
  res.status(200).json(request);
});

export const rejectEvent = asyncErrorHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id?.trim().length === 0) {
    throw new AppError('Parameter \'id\' is required', 400);
  }

  const { rejectionReason } = req.body || {};

  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw new AppError('Field \'rejectionReason\' is required', 400);
  }

  const request = await AdminService.rejectEvent(id, rejectionReason);
  res.status(200).json(request);
});
