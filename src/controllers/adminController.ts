import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import AdminService from '@services/AdminRequestService';
import { AppError } from '@utils/AppError';
import { Request, Response } from 'express';

export const getRoleRequests = asyncErrorHandler(
  async (_req: Request, res: Response) => {
    const requests = await AdminService.getRoleRequests();
    res.status(200).json(requests);
  },
);

export const approveRequest = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user!.uid;
    const { requestId } = req.params;

    if (!requestId || requestId?.trim().length === 0) {
      throw new AppError("Parameter 'requestId' is required", 400);
    }

    const request = await AdminService.approveRoleRequest(adminId, requestId);
    res.status(200).json(request);
  },
);

export const rejectRequest = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user!.uid;
    const { requestId } = req.params;

    if (!requestId || requestId?.trim().length === 0) {
      throw new AppError("Parameter 'id' is required", 400);
    }

    const { rejectionReason } = req.body || {};

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new AppError("Field 'rejectionReason' is required", 400);
    }

    const request = await AdminService.rejectRoleRequest(
      adminId,
      requestId,
      rejectionReason,
    );
    res.status(200).json(request);
  },
);

export const approveEvent = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user!.uid;
    const { eventId } = req.params;

    if (!eventId || eventId?.trim().length === 0) {
      throw new AppError("Parameter 'id' is required", 400);
    }

    const request = await AdminService.approveEvent(adminId, eventId);
    res.status(200).json(request);
  },
);

export const rejectEvent = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user!.uid;
    const { eventId } = req.params;

    if (!eventId || eventId?.trim().length === 0) {
      throw new AppError("Parameter 'id' is required", 400);
    }

    const { rejectionReason } = req.body || {};

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new AppError("Field 'rejectionReason' is required", 400);
    }

    const request = await AdminService.rejectEvent(
      adminId,
      eventId,
      rejectionReason,
    );
    res.status(200).json(request);
  },
);
