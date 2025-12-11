import { Request, Response } from 'express';

const health = (_req: Request, res: Response) => {
  res.json({ ok: true, ts: new Date().toISOString() });
};

export default { health };
