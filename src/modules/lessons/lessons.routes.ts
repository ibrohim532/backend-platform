import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Lessons
 *   description: "Darslar (Video darslar, Audio materiallar, Konspekt PDF)"
 */

/**
 * @swagger
 * /lessons/{id}:
 *   get:
 *     summary: "Bitta dars (video/audio/pdf) va uning materiallari"
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Dars ma'lumotlari" }
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: {
        materials: true,
        tests: { select: { id: true, title: true, type: true } },
      },
    });
    if (!lesson) return res.status(404).json({ message: "Dars topilmadi." });
    res.json(lesson);
  })
);

/**
 * @swagger
 * /lessons:
 *   post:
 *     summary: "Kursga yangi dars qo'shish (video/audio/pdf havolalari bilan)"
 *     tags: [Lessons]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, courseId]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               courseId: { type: string }
 *               videoUrl: { type: string }
 *               audioUrl: { type: string }
 *               pdfUrl: { type: string, description: "Konspekt fayli (yuklab olish uchun)" }
 *               order: { type: integer }
 *     responses:
 *       201: { description: "Dars yaratildi" }
 */
router.post(
  "/",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { title, description, courseId, videoUrl, audioUrl, pdfUrl, order } = req.body;

    const lesson = await prisma.lesson.create({
      data: { title, description, courseId, videoUrl, audioUrl, pdfUrl, order: order || 0 },
    });

    res.status(201).json(lesson);
  })
);

/**
 * @swagger
 * /lessons/{id}:
 *   put:
 *     summary: Darsni tahrirlash
 *     tags: [Lessons]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Yangilandi }
 */
router.put(
  "/:id",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { title, description, videoUrl, audioUrl, pdfUrl, order } = req.body;
    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: { title, description, videoUrl, audioUrl, pdfUrl, order },
    });
    res.json(lesson);
  })
);

/**
 * @swagger
 * /lessons/{id}:
 *   delete:
 *     summary: Darsni o'chirish
 *     tags: [Lessons]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "O'chirildi" }
 */
router.delete(
  "/:id",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.lesson.delete({ where: { id: req.params.id } });
    res.json({ message: "Dars o'chirildi." });
  })
);

export default router;
