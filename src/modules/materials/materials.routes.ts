import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Materials
 *   description: "Materiallar (PDF, Vocabulary list, Grammar notes, Homework)"
 */

/**
 * @swagger
 * /materials/lesson/{lessonId}:
 *   get:
 *     summary: Bitta darsga tegishli barcha materiallar
 *     tags: [Materials]
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Materiallar ro'yxati" }
 */
router.get(
  "/lesson/:lessonId",
  asyncHandler(async (req, res) => {
    const materials = await prisma.material.findMany({
      where: { lessonId: req.params.lessonId },
    });
    res.json(materials);
  })
);

/**
 * @swagger
 * /materials:
 *   post:
 *     summary: "Darsga material qo'shish (PDF/Vocabulary/Grammar/Homework)"
 *     tags: [Materials]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type, fileUrl, lessonId]
 *             properties:
 *               title: { type: string }
 *               type: { type: string, enum: [PDF, VOCABULARY_LIST, GRAMMAR_NOTES, HOMEWORK] }
 *               fileUrl: { type: string }
 *               lessonId: { type: string }
 *     responses:
 *       201: { description: "Material qo'shildi" }
 */
router.post(
  "/",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { title, type, fileUrl, lessonId } = req.body;
    const material = await prisma.material.create({
      data: { title, type, fileUrl, lessonId },
    });
    res.status(201).json(material);
  })
);

/**
 * @swagger
 * /materials/{id}:
 *   delete:
 *     summary: Materialni o'chirish
 *     tags: [Materials]
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
    await prisma.material.delete({ where: { id: req.params.id } });
    res.json({ message: "Material o'chirildi." });
  })
);

export default router;
