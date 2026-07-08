import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Enrollments
 *   description: "Kurslarim (ro'yxatga olish, progress)"
 */

/**
 * @swagger
 * /enrollments/my:
 *   get:
 *     summary: "Foydalanuvchi sotib olgan/yozilgan kurslari (Kurslarim)"
 *     tags: [Enrollments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Kurslar ro'yxati" }
 */
router.get(
  "/my",
  authenticate,
  asyncHandler(async (req, res) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user!.id },
      include: {
        course: {
          include: { teacher: { select: { fullName: true } }, _count: { select: { lessons: true } } },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });
    res.json(enrollments);
  })
);

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: "Kursga yozilish (bepul kurs yoki to'lovdan keyin chaqiriladi)"
 *     tags: [Enrollments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId: { type: string }
 *     responses:
 *       201: { description: "Kursga yozildi" }
 */
router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { courseId } = req.body;
    const enrollment = await prisma.enrollment.create({
      data: { userId: req.user!.id, courseId },
    });
    res.status(201).json(enrollment);
  })
);

/**
 * @swagger
 * /enrollments/{id}/progress:
 *   put:
 *     summary: "Kurs progressini yangilash (foizda)"
 *     tags: [Enrollments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [progressPercent]
 *             properties:
 *               progressPercent: { type: integer, example: 45 }
 *     responses:
 *       200: { description: "Progress yangilandi" }
 */
router.put(
  "/:id/progress",
  authenticate,
  asyncHandler(async (req, res) => {
    const { progressPercent } = req.body;
    const isCompleted = progressPercent >= 100;

    const enrollment = await prisma.enrollment.update({
      where: { id: req.params.id },
      data: {
        progressPercent,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
        completedAt: isCompleted ? new Date() : null,
      },
    });

    res.json(enrollment);
  })
);

export default router;
