import cors from 'cors';
import express from 'express';

import { globalErrorHandler } from '@middlewares/errorMiddleware';
import defaultRoutes from '@routes/defaultRoutes';
import eventRoutes from '@routes/eventRoutes';
import notificationRoutes from '@routes/notificationRoutes';
import requestRoutes from '@routes/requestRoutes';
import reviewRoutes from '@routes/reviewRoutes';
import userRoutes from '@routes/userRoutes';
import { AppError } from '@utils/AppError';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const baseUrlPrefix = '/api';

app.use(`${baseUrlPrefix}`, defaultRoutes);
app.use(`${baseUrlPrefix}/events`, eventRoutes);
app.use(`${baseUrlPrefix}/reviews`, reviewRoutes);
app.use(`${baseUrlPrefix}/users`, userRoutes);
app.use(`${baseUrlPrefix}/requests`, requestRoutes);
app.use(`${baseUrlPrefix}/notifications`, notificationRoutes);

app.use((req, _res, _next) => {
  throw new AppError(
    `Can't find route '${req.originalUrl}' on this server.`,
    404,
  );
});

app.use(globalErrorHandler);

export default app;
