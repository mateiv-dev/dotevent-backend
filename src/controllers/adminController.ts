import { Request, Response } from "express";
import { asyncErrorHandler } from "@middlewares/errorMiddleware";
import AdminRequestService from "@services/AdminRequestService";
import { AppError } from "@utils/AppError";

export const getRequests = asyncErrorHandler(async (req: Request, res: Response) => {
  const requests = await AdminRequestService.getRequests();
  res.status(200).json(requests);
});

export const approveRequest = asyncErrorHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const request = await AdminRequestService.approveRequest(id);
  res.status(200).json(request);
});
