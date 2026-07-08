import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { signToken } from "../../utils/jwt";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Ro'yxatdan o'tish, tizimga kirish va shaxsiy kabinet autentifikatsiyasi
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Yangi foydalanuvchi ro'yxatdan o'tkazish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName: { type: string, example: "Aziz Aliyev" }
 *               email: { type: string, example: "aziz@example.com" }
 *               phone: { type: string, example: "+998901234567" }
 *               password: { type: string, example: "password123" }
 *               role: { type: string, enum: [STUDENT, TEACHER], example: "STUDENT" }
 *     responses:
 *       201: { description: Muvaffaqiyatli ro'yxatdan o'tildi }
 *       409: { description: Bu email allaqachon mavjud }
 */
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { fullName, email, phone, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "fullName, email va password majburiy." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Bu email bilan foydalanuvchi allaqachon mavjud." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        role: role === "TEACHER" ? "TEACHER" : "STUDENT",
      },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    });

    const token = signToken({ id: user.id, role: user.role, email: user.email });

    res.status(201).json({ user, token });
  })
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Tizimga kirish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Muvaffaqiyatli kirildi }
 *       401: { description: Email yoki parol noto'g'ri }
 */
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Email yoki parol noto'g'ri." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email yoki parol noto'g'ri." });
    }

    const token = signToken({ id: user.id, role: user.role, email: user.email });

    res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  })
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Joriy foydalanuvchi profilini olish (Shaxsiy kabinet)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Foydalanuvchi ma'lumotlari }
 *       401: { description: Avtorizatsiyadan o'tilmagan }
 */
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        bio: true,
        experience: true,
        createdAt: true,
      },
    });
    res.json(user);
  })
);

export default router;
