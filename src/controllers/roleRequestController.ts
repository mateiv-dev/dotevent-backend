import {
  CreateRoleRequestDto,
  ResponseRoleRequestDto,
} from '@dtos/RoleRequestDto';
import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import { default as RoleRequestService } from '@services/RoleRequestService';
import { AppError } from '@utils/AppError';
import { Request, Response } from 'express';

export const getRoleRequests = asyncErrorHandler(
  async (_req: Request, res: Response) => {
    const requests = await RoleRequestService.getRoleRequests();
    const requestsDto = ResponseRoleRequestDto.fromArray(requests);
    return res.status(200).json(requestsDto);
  },
);

export const getUserRoleRequests = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const requests = await RoleRequestService.getUserRoleRequests(userId);
    const requestsDto = ResponseRoleRequestDto.fromArray(requests);
    return res.status(200).json(requestsDto);
  },
);

export const createRoleRequest = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const requestData: CreateRoleRequestDto = req.body;

    const request = await RoleRequestService.createRoleRequest(
      userId,
      requestData,
    );

    return res.status(200).json(ResponseRoleRequestDto.from(request));
  },
);

export const deleteRoleRequest = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const { requestId } = req.params;

    if (!requestId || requestId?.trim().length === 0) {
      throw new AppError('Request ID is required', 400);
    }

    await RoleRequestService.deleteRoleRequest(userId, requestId);
    return res.status(200).send();
  },
);

export const approveRoleRequest = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user!.uid;
    const { requestId } = req.params;

    if (!requestId || requestId?.trim().length === 0) {
      throw new AppError('Request ID is required', 400);
    }

    const request = await RoleRequestService.approveRoleRequest(
      adminId,
      requestId,
    );

    res.status(200).json(ResponseRoleRequestDto.from(request));
  },
);

export const rejectRoleRequest = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user!.uid;
    const { requestId } = req.params;

    if (!requestId || requestId?.trim().length === 0) {
      throw new AppError('Request ID is required', 400);
    }

    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new AppError("Field 'rejectionReason' is required", 400);
    }

    const request = await RoleRequestService.rejectRoleRequest(
      adminId,
      requestId,
      rejectionReason,
    );
    res.status(200).json(ResponseRoleRequestDto.from(request));
  },
);
