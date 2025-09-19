import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (
  schema: Joi.ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
      return;
    }

    // Replace the request property with the validated value
    req[property] = value;
    next();
  };
};

export const validateBody = (schema: Joi.ObjectSchema) => {
  return validateRequest(schema, 'body');
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return validateRequest(schema, 'query');
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return validateRequest(schema, 'params');
};