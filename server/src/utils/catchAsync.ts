import { Request, Response, NextFunction } from 'express';

export const catchAsync = (fn: Function) => {
  return (req: any, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
