import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

// Express Request obyektiga user maydonini qo'shamiz
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Foydalanuvchi tizimga kirganligini tekshiradi
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token topilmadi. Iltimos tizimga kiring." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token yaroqsiz yoki muddati o'tgan." });
  }
}

// Faqat berilgan role(lar)ga ruxsat beradi. Masalan: authorize("ADMIN", "TEACHER")
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Avtorizatsiyadan o'ting." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bu amal uchun ruxsatingiz yo'q." });
    }
    next();
  };
}
