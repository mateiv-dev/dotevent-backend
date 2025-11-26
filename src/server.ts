import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';

import { AppError } from './utils/app_error';
import eventRoutes from './routes/event_routes';
import defaultRoutes from './routes/default_routes';
import { globalErrorHandler } from './middlewares/global_error_handler';
import firebase from './middlewares/firebase';

const server = express();
// const authService = firebase.auth();

server.use(cors());
server.use(express.json());

server.use("/api", defaultRoutes);
server.use('/api/events', eventRoutes);

server.use((req: Request, _res: Response, _next: NextFunction) => {
  throw new AppError(`Can't find route '${req.originalUrl}' on this server.`, 404);
});

server.use(globalErrorHandler);

export default server;
