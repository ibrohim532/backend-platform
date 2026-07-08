import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: "Bildirishnomalar (Yangi darslar, Yangi testlar, Muhim e'lonlar)"
 */

/**
 * @swagger
 * /notifications/my:
 *   get:
 *     summary: "Foydalanuvchining bildirishnomalari"
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Bildirishnomalar ro'yxati" }
 */
router.get(
  "/my",
  authenticate,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  })
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: "Bildirishnomani o'qilgan deb belgilash"
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Belgilandi" }
 */
router.put(
  "/:id/read",
  authenticate,
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(notification);
  })
);

/**
 * @swagger
 * /notifications/broadcast:
 *   post:
 *     summary: "Barcha (yoki kurs) o'quvchilariga bildirishnoma yuborish (Yangi dars/test/e'lon)"
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message, type]
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *               type: { type: string, enum: [NEW_LESSON, NEW_TEST, ANNOUNCEMENT, QNA_ANSWER, PAYMENT] }
 *               courseId:
 *                 type: string
 *                 description: "Berilsa, faqat shu kursga yozilganlarga yuboriladi"
 *     responses:
 *       201: { description: "Bildirishnomalar yuborildi" }
 */
router.post(
  "/broadcast",
  authenticate,
  asyncHandler(async (req, res) => {
    const { title, message, type, courseId } = req.body;

    let userIds: string[];

    if (courseId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId },
        select: { userId: true },
      });
      userIds = enrollments.map((e) => e.userId);
    } else {
      const users = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } });
      userIds = users.map((u) => u.id);
    }

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, title, message, type })),
    });

    res.status(201).json({ message: `${userIds.length} foydalanuvchiga yuborildi.` });
  })
);

export default router;
