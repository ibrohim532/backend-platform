import { Request, Response, NextFunction } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `Manzil topilmadi: ${req.originalUrl}` });
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);

  // Prisma unique constraint xatoligi
  if (err.code === "P2002") {
    return res.status(409).json({
      message: `Bu qiymat allaqachon mavjud: ${err.meta?.target?.join(", ")}`,
    });
  }

  // Prisma "topilmadi" xatoligi
  if (err.code === "P2025") {
    return res.status(404).json({ message: "Yozuv topilmadi." });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Serverda ichki xatolik yuz berdi.",
  });
}
