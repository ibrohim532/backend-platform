import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Profil, sozlamalar va o'qituvchilar haqida ma'lumot
 */

/**
 * @swagger
 * /users/teachers:
 *   get:
 *     summary: "Barcha o'qituvchilar ro'yxati (Landing sahifa - 'O'qituvchi haqida' bo'limi uchun)"
 *     tags: [Users]
 *     responses:
 *       200: { description: "O'qituvchilar ro'yxati" }
 */
router.get(
  "/teachers",
  asyncHandler(async (req, res) => {
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER", isActive: true },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        bio: true,
        experience: true,
        _count: { select: { coursesTaught: true } },
      },
    });
    res.json(teachers);
  })
);

/**
 * @swagger
 * /users/teachers/{id}:
 *   get:
 *     summary: Bitta o'qituvchi haqida batafsil ma'lumot
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "O'qituvchi ma'lumotlari" }
 *       404: { description: Topilmadi }
 */
router.get(
  "/teachers/:id",
  asyncHandler(async (req, res) => {
    const teacher = await prisma.user.findFirst({
      where: { id: req.params.id, role: "TEACHER" },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        bio: true,
        experience: true,
        coursesTaught: {
          where: { isPublished: true },
          select: { id: true, title: true, level: true, thumbnailUrl: true },
        },
      },
    });
    if (!teacher) return res.status(404).json({ message: "O'qituvchi topilmadi." });
    res.json(teacher);
  })
);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: "Profilni tahrirlash (Sozlamalar)"
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               phone: { type: string }
 *               avatarUrl: { type: string }
 *               bio: { type: string }
 *     responses:
 *       200: { description: Yangilandi }
 */
router.put(
  "/profile",
  authenticate,
  asyncHandler(async (req, res) => {
    const { fullName, phone, avatarUrl, bio, experience } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { fullName, phone, avatarUrl, bio, experience },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        experience: true,
      },
    });

    res.json(user);
  })
);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: "Parolni almashtirish (Sozlamalar)"
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: "Parol o'zgartirildi" }
 *       401: { description: "Eski parol noto'g'ri" }
 */
router.put(
  "/change-password",
  authenticate,
  asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi." });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Eski parol noto'g'ri." });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    res.json({ message: "Parol muvaffaqiyatli o'zgartirildi." });
  })
);

export default router;
