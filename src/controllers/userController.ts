import { ResponseEventDto } from '@dtos/EventDto';
import { CreateUserDto, ResponseUserDto, UpdateUserDto } from '@dtos/UserDto';
import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import EventRegistrationService from '@services/EventRegistrationService';
import EventService from '@services/EventService';
import UserService from '@services/UserService';
import { Request, Response } from 'express';

export const getUsers = asyncErrorHandler(
  async (_req: Request, res: Response) => {
    const users = await UserService.getUsers();
    res.status(200).json(ResponseUserDto.fromArray(users));
  },
);

export const getUser = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const id = req.user!.uid;
    const user = await UserService.getUser(id!);
    res.status(200).json(ResponseUserDto.from(user));
  },
);

export const createUser = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { name, adminKey } = req.body;
    const userId = req.user!.uid;
    const email = req.user!.email!;

    const userData: CreateUserDto = {
      firebaseId: userId,
      email,
      name,
    };

    const createdUser = await UserService.createUser(userData, adminKey);

    res.status(201).json(ResponseUserDto.from(createdUser));
  },
);

export const deleteUser = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const id = req.user!.uid;
    const deletedUser = await UserService.deleteUser(id!);
    res.status(200).json(ResponseUserDto.from(deletedUser));
  },
);

export const updateUser = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const incomingData: UpdateUserDto = req.body;
    const user = await UserService.updateUser(userId, incomingData);
    res.status(200).json(ResponseUserDto.from(user));
  },
);

export const syncEmail = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const newEmail = req.user!.email;

    const updatedUser = await UserService.syncEmail(userId, newEmail!);

    res.status(200).json(updatedUser);
  },
);

export const getUserEvents = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const events = await EventService.getUserEvents(userId);
    return res.status(200).json(events);
  },
);

export const getUserRegisteredEvents = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;

    const registrations = await EventRegistrationService.getUserRegistrations(
      userId,
    );

    const events = registrations.map((reg) =>
      ResponseEventDto.from(reg.event as any),
    );

    return res.status(200).json(events);
  },
);

export const getUserFavoriteEvents = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const favoriteEvents = await EventService.getUserFavoriteEvents(userId);
    res.status(200).json(ResponseEventDto.fromArray(favoriteEvents));
  },
);
