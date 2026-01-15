import { asyncErrorHandler } from '@middlewares/errorMiddleware';
import StatisticsService from '@services/StatisticsService';
import { Request, Response } from 'express';

export const getTotalStatistics = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.uid;
    const statistics = await StatisticsService.getTotalStatistics(userId);
    res.status(200).json(statistics);
  },
);
