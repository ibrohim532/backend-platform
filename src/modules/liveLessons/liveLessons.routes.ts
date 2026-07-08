import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: LiveLessons
 *   description: "Jonli darslar (Dars jadvali, Zoom/Google Meet havolalari, Dars yozuvlari)"
 */

/**
 * @swagger
 * /live-lessons/course/{courseId}:
 *   get:
 *     summary: "Kursning jonli darslar jadvali"
 *     tags: [LiveLessons]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Jonli darslar ro'yxati" }
 */
router.get(
  "/course/:courseId",
  asyncHandler(async (req, res) => {
    const liveLessons = await prisma.liveLesson.findMany({
      where: { courseId: req.params.courseId },
      orderBy: { scheduledAt: "asc" },
    });
    res.json(liveLessons);
  })
);

/**
 * @swagger
 * /live-lessons:
 *   post:
 *     summary: "Yangi jonli dars belgilash (Zoom yoki Google Meet)"
 *     tags: [LiveLessons]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, courseId, meetingLink, scheduledAt]
 *             properties:
 *               title: { type: string }
 *               courseId: { type: string }
 *               platform: { type: string, enum: [ZOOM, GOOGLE_MEET] }
 *               meetingLink: { type: string }
 *               scheduledAt: { type: string, format: date-time }
 *     responses:
 *       201: { description: "Jonli dars belgilandi" }
 */
router.post(
  "/",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { title, courseId, platform, meetingLink, scheduledAt } = req.body;
    const liveLesson = await prisma.liveLesson.create({
      data: { title, courseId, platform, meetingLink, scheduledAt: new Date(scheduledAt) },
    });
    res.status(201).json(liveLesson);
  })
);

/**
 * @swagger
 * /live-lessons/{id}/recording:
 *   put:
 *     summary: "Jonli dars yozuvini biriktirish (dars tugagach)"
 *     tags: [LiveLessons]
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
 *             required: [recordingUrl]
 *             properties:
 *               recordingUrl: { type: string }
 *     responses:
 *       200: { description: "Yozuv biriktirildi" }
 */
router.put(
  "/:id/recording",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { recordingUrl } = req.body;
    const liveLesson = await prisma.liveLesson.update({
      where: { id: req.params.id },
      data: { recordingUrl },
    });
    res.json(liveLesson);
  })
);

export default router;
