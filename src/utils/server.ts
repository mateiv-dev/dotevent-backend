import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';

import defaultRoutes from '../routes/default_routes';
import eventRoutes from '../routes/event_routes';
import { AppError } from './app_error';
import { globalErrorHandler } from '../middlewares/global_error_handler';

const server = express();

server.use(cors());
server.use(express.json());

server.use("/api", defaultRoutes);
server.use('/api/events', eventRoutes);

server.use((req: Request, _res: Response, _next: NextFunction) => {
  throw new AppError(`Can't find route '${req.originalUrl}' on this server.`, 404);
});

server.use(globalErrorHandler);

export default server;
