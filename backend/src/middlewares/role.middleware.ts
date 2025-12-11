import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'unauthenticated' });
    if (req.user.role !== role) return res.status(403).json({ message: 'forbidden' });
    return next();
  };
}
