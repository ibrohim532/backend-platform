import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: "Kurslar (Elementary, Pre-Intermediate, Intermediate, Upper-Intermediate, IELTS, Grammar, Vocabulary, Speaking)"
 */

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: "Barcha kurslar ro'yxati (filter: level)"
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: level
 *         schema: { type: string, enum: [ELEMENTARY, PRE_INTERMEDIATE, INTERMEDIATE, UPPER_INTERMEDIATE, IELTS, GRAMMAR, VOCABULARY, SPEAKING] }
 *     responses:
 *       200: { description: "Kurslar ro'yxati" }
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { level } = req.query;
    const courses = await prisma.course.findMany({
      where: {
        isPublished: true,
        ...(level ? { level: level as any } : {}),
      },
      include: {
        teacher: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(courses);
  })
);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Bitta kurs haqida batafsil ma'lumot (darslar bilan)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Kurs ma'lumotlari" }
 *       404: { description: Topilmadi }
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        teacher: { select: { id: true, fullName: true, avatarUrl: true, bio: true } },
        lessons: { orderBy: { order: "asc" } },
        liveLessons: { orderBy: { scheduledAt: "asc" } },
      },
    });
    if (!course) return res.status(404).json({ message: "Kurs topilmadi." });
    res.json(course);
  })
);

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: "Yangi kurs yaratish (faqat TEACHER yoki ADMIN)"
 *     tags: [Courses]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, level]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               level: { type: string, enum: [ELEMENTARY, PRE_INTERMEDIATE, INTERMEDIATE, UPPER_INTERMEDIATE, IELTS, GRAMMAR, VOCABULARY, SPEAKING] }
 *               price: { type: number }
 *               thumbnailUrl: { type: string }
 *     responses:
 *       201: { description: "Kurs yaratildi" }
 */
router.post(
  "/",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { title, description, level, price, thumbnailUrl } = req.body;

    const course = await prisma.course.create({
      data: {
        title,
        description,
        level,
        price: price || 0,
        thumbnailUrl,
        teacherId: req.user!.id,
      },
    });

    res.status(201).json(course);
  })
);

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Kursni tahrirlash
 *     tags: [Courses]
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
    const { title, description, level, price, thumbnailUrl, isPublished } = req.body;
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { title, description, level, price, thumbnailUrl, isPublished },
    });
    res.json(course);
  })
);

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Kursni o'chirish
 *     tags: [Courses]
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
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ message: "Kurs o'chirildi." });
  })
);

export default router;
