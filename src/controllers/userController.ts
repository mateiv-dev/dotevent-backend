import { Request, Response } from "express";
import { CreateUserDto, ResponseUserDto, UpdateUserDto } from "@dtos/UserDto";
import { asyncErrorHandler } from "@middlewares/errorMiddleware";
import UserService from "@services/UserService";
import UserRequestService from "@services/UserRequestService";
import { CreateRoleRequestDto } from "@dtos/RoleRequestDto";
import EventRegistrationService from "@services/EventRegistrationService";
import { ResponseEventDto } from "@dtos/EventDto";
import EventService from "@services/EventService";

export const getUsers = asyncErrorHandler(async (_req: Request, res: Response) => {
  const users = await UserService.getUsers();
  res.status(200).json(ResponseUserDto.fromArray(users));
});

export const createUser = asyncErrorHandler(async (req: Request, res: Response) => {
  const { name, adminKey } = req.body || {};
  const firebaseId = req.user!.uid;
  const email = req.user!.email!;

  const userData: CreateUserDto = {
    firebaseId,
    email,
    name
  };

  const createdUser = await UserService.createUser(userData, adminKey);

  res.status(201).json(ResponseUserDto.from(createdUser));
});

export const deleteMe = asyncErrorHandler(async (req: Request, res: Response) => {
  const id = req.user!.uid;
  const deletedUser = await UserService.deleteMe(id!);
  res.status(200).json(ResponseUserDto.from(deletedUser));
});

export const getMe = asyncErrorHandler(async (req: Request, res: Response) => {
  const id = req.user!.uid;
  const user = await UserService.getMe(id!);
  res.status(200).json(ResponseUserDto.from(user));
});

export const updateMe = asyncErrorHandler(async (req: Request, res: Response) => {
  const id = req.user!.uid;
  const incomingData: UpdateUserDto = req.body;
  const user = await UserService.updateUser(id!, incomingData);
  res.status(200).json(ResponseUserDto.from(user));
});

export const syncEmail = asyncErrorHandler(async (req: Request, res: Response) => {
  const firebaseId = req.user!.uid;
  const newEmail = req.user!.email;
  const updatedUser = await UserService.syncEmail(firebaseId, newEmail!);
  res.status(200).json(updatedUser);
});

export const getMeRequests = asyncErrorHandler(async (req: Request, res: Response) => {
  const firebaseId = req.user!.uid;
  const requests = await UserRequestService.getRequests(firebaseId);
  return res.status(200).json(requests);
});

export const createRequest = asyncErrorHandler(async (req: Request, res: Response) => {
  const firebaseId = req.user!.uid;
  const incomingData: CreateRoleRequestDto = req.body;
  const request = await UserRequestService.createRequest(firebaseId, incomingData);
  return res.status(200).json(request);
});

export const getMeEvents = asyncErrorHandler(async (req: Request, res: Response) => {
  const firebaseId = req.user!.uid;
  const registrations = await EventRegistrationService.getUserRegistrations(firebaseId);
  const events = registrations.map(reg => ResponseEventDto.from(reg.event as any));
  return res.status(200).json(events);
});

export const getFavoriteEvents = asyncErrorHandler(async (req: Request, res: Response) => {
  const firebaseId = req.user!.uid;
  console.log(`firebaseId: ${firebaseId}`);
  const favoriteEvents = await EventService.getMeFavoriteEvents(firebaseId);
  res.status(200).json(ResponseEventDto.fromArray(favoriteEvents));
});
