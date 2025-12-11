import { Request, Response, NextFunction } from 'express';
import { ValidationResult } from '../types/validation';

export function handleValidationError(res: Response, result: ValidationResult) {
  const payload = {
    message: 'validation failed',
    errors: result.errors || [],
  };
  return res.status(400).json(payload);
}

export function validateRequest(
  fn: (data: any) => ValidationResult,
  source: 'body' | 'query' = 'body',
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : req.query;
      const result = fn(data);
      if (!result.valid) return handleValidationError(res, result);
      // attach cleaned value if present
      if (result.value !== undefined) {
        if (source === 'body') (req as any).validatedBody = result.value;
        else (req as any).validatedQuery = result.value;
      }
      return next();
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: 'validation middleware error', error: String(err && err.message) });
    }
  };
}
