import type { Request, Response, NextFunction } from "express";

export function requestLogger(request: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`[http] ${request.method} ${request.path} ${res.statusCode} ${ms}ms`);
  });
  next();
}
