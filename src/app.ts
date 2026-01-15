import cors from 'cors';
import express from 'express';

import { globalErrorHandler } from '@middlewares/errorMiddleware';
import defaultRoutes from '@routes/defaultRoutes';
import eventRoutes from '@routes/eventRoutes';
import notificationRoutes from '@routes/notificationRoutes';
import reviewRoutes from '@routes/reviewRoutes';
import requestRoutes from '@routes/roleRequestRoutes';
import statisticsRoutes from '@routes/statisticsRoutes';
import userRoutes from '@routes/userRoutes';
import { AppError } from '@utils/AppError';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use(defaultRoutes);
app.use(`/events`, eventRoutes);
app.use(`/reviews`, reviewRoutes);
app.use(`/users`, userRoutes);
app.use(`/role-requests`, requestRoutes);
app.use(`/notifications`, notificationRoutes);
app.use(`/statistics`, statisticsRoutes);

app.use((req, _res, _next) => {
  throw new AppError(
    `Can't find route '${req.originalUrl}' on this server.`,
    404,
  );
});

app.use(globalErrorHandler);

export default app;
