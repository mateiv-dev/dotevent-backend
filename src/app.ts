import express from 'express';
import cors from 'cors';

import defaultRoutes from '@routes/defaultRoutes';
import eventRoutes from '@routes/eventRoutes';
import { AppError } from '@utils/AppError';
import { globalErrorHandler } from '@middlewares/errorMiddleware';
import userRoutes from '@routes/userRoutes';
import requestRoutes from '@routes/requestRoutes';
import notificationRoutes from '@routes/notificationRoutes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use("/api", defaultRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, _res, _next) => {
  throw new AppError(`Can't find route '${req.originalUrl}' on this server.`, 404);
});

app.use(globalErrorHandler);

export default app;
