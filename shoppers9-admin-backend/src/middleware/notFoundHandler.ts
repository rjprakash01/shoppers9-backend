import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  res.status(404).json({
    success: false,
    message: error.message,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};