import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const configuredKey = process.env.API_KEY;
  if (!configuredKey) {
    // If not configured, allow all for development but warn
    // eslint-disable-next-line no-console
    console.warn('Warning: API_KEY not set. Authentication is disabled.');
    return next();
  }
  const headerKey = req.header('x-api-key');
  if (!headerKey || headerKey !== configuredKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

