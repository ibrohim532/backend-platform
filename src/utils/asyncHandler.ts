import { Request, Response, NextFunction, RequestHandler } from "express";

// Har bir controllerda try/catch yozmaslik uchun wrapper.
// Xatolik bo'lsa avtomatik ravishda error middleware'ga uzatiladi.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
