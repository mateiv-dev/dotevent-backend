import { Request, Response, NextFunction } from 'express';

type AsyncControllerFunction = (req: Request, res: Response) => Promise<any>;

export const asyncErrorHandler = (fn: AsyncControllerFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(error => next(error));
  };
};
