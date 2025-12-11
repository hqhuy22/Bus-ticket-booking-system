import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../utils/tokenBlacklist';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string; role?: string };
}
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ message: 'missing token' });

  const token = auth.slice('Bearer '.length);
  try {
    // Check blacklist first
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return res.status(401).json({ message: 'token revoked' });

    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch (err: any) {
    return res.status(401).json({ message: 'invalid token' });
  }
}
