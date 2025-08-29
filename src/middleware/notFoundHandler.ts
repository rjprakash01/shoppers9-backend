export const notFoundHandler = (req: any, res: any, next: any): void => {
  const response = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'Not Found'
  };

  res.status(404).json(response);
};