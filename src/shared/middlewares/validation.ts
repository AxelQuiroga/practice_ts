import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
        return;
      }
      res.status(400).json({ error: 'Invalid request data' });
    }
  };
};

export const validateCookie = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req.cookies;
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
        return;
      }
      res.status(400).json({ error: 'Invalid cookie data' });
    }
  };
};

export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
