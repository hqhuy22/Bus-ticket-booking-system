import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export function signAccessToken(payload: { sub: string; email?: string; role?: string }) {
  return jwt.sign(
    payload,
    JWT_SECRET as jwt.Secret,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
  );
}

export function signRefreshToken(payload: { sub: string; email?: string; role?: string }) {
  return jwt.sign(
    payload,
    JWT_SECRET as jwt.Secret,
    { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions,
  );
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET as jwt.Secret) as any;
}
