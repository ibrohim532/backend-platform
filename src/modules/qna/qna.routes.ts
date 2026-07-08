import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: QnA
 *   description: Savol-javob (O'quvchi savol yuboradi, O'qituvchi javob beradi)
 */

/**
 * @swagger
 * /qna:
 *   get:
 *     summary: Barcha savol-javoblarni olish
 *     tags: [QnA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Savollar ro'yxati
 */
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const qna = await prisma.qnA.findMany({
      include: {
        student: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
        teacher: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(qna);
  })
);

/**
 * @swagger
 * /qna/course/{courseId}:
 *   get:
 *     summary: Kursga tegishli barcha savol-javoblar
 *     tags: [QnA]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Savollar ro'yxati
 */
router.get(
  "/course/:courseId",
  asyncHandler(async (req, res) => {
    const qna = await prisma.qnA.findMany({
      where: {
        courseId: req.params.courseId,
      },
      include: {
        student: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
        teacher: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(qna);
  })
);

/**
 * @swagger
 * /qna:
 *   post:
 *     summary: O'quvchi savol yuboradi
 *     tags: [QnA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *               courseId:
 *                 type: string
 *               lessonId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Savol yuborildi
 */
router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { question, courseId, lessonId } = req.body;

    const qna = await prisma.qnA.create({
      data: {
        question,
        courseId,
        lessonId,
        studentId: req.user!.id,
      },
    });

    res.status(201).json(qna);
  })
);

/**
 * @swagger
 * /qna/{id}/answer:
 *   put:
 *     summary: O'qituvchi javob beradi
 *     tags: [QnA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answer
 *             properties:
 *               answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Javob berildi
 */
router.put(
  "/:id/answer",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { answer } = req.body;

    const qna = await prisma.qnA.update({
      where: {
        id: req.params.id,
      },
      data: {
        answer,
        answeredAt: new Date(),
        teacherId: req.user!.id,
      },
    });

    await prisma.notification.create({
      data: {
        userId: qna.studentId,
        title: "Savolingizga javob berildi",
        message:
          "O'qituvchi sizning savolingizga javob berdi. Tekshirib ko'ring.",
        type: "QNA_ANSWER",
      },
    });

    res.json(qna);
  })
);

export default router;