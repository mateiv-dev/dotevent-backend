import { CreateRoleRequestDto } from '@dtos/RoleRequestDto';
import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import UserRequestService from '@services/UserRequestService';
import { Request, Response } from 'express';

export const getUserRoleRequests = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const requests = await UserRequestService.getUserRoleRequests(userId);
    return res.status(200).json(requests);
  },
);

export const createRoleRequest = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;

    const requestData: CreateRoleRequestDto = req.body;
    const request = await UserRequestService.createRoleRequest(
      userId,
      requestData,
    );

    return res.status(200).json(request);
  },
);

export const deleteRoleRequest = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;

    await UserRequestService.deleteRoleRequest(userId);

    return res.status(200).json();
  },
);
