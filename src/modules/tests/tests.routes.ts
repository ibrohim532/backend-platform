import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tests
 *   description: "Test markazi (Har darsdan keyin test, Yakuniy test)"
 */

/**
 * @swagger
 * /tests/{id}:
 *   get:
 *     summary: "Testni olish (savollar bilan, to'g'ri javobsiz - talaba uchun)"
 *     tags: [Tests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Test va savollar" }
 */
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          select: { id: true, text: true, options: true, order: true }, // correctIndex yashiriladi
          orderBy: { order: "asc" },
        },
      },
    });
    if (!test) return res.status(404).json({ message: "Test topilmadi." });
    res.json(test);
  })
);

/**
 * @swagger
 * /tests:
 *   post:
 *     summary: "Yangi test yaratish (savollar bilan birga)"
 *     tags: [Tests]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, questions]
 *             properties:
 *               title: { type: string }
 *               type: { type: string, enum: [LESSON, FINAL] }
 *               passScore: { type: integer, example: 60 }
 *               lessonId: { type: string }
 *               courseId: { type: string }
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text: { type: string }
 *                     options: { type: array, items: { type: string } }
 *                     correctIndex: { type: integer }
 *     responses:
 *       201: { description: "Test yaratildi" }
 */
router.post(
  "/",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { title, type, passScore, lessonId, courseId, questions } = req.body;

    const test = await prisma.test.create({
      data: {
        title,
        type: type || "LESSON",
        passScore: passScore || 60,
        lessonId,
        courseId,
        questions: {
          create: (questions || []).map((q: any, i: number) => ({
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            order: i,
          })),
        },
      },
      include: { questions: true },
    });

    res.status(201).json(test);
  })
);

/**
 * @swagger
 * /tests/{id}/submit:
 *   post:
 *     summary: "Testni topshirish va natijani hisoblash"
 *     tags: [Tests]
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
 *             required: [answers]
 *             properties:
 *               answers:
 *                 type: object
 *                 description: "{ questionId: chosenIndex }"
 *                 example: { "question-id-1": 2, "question-id-2": 0 }
 *     responses:
 *       200: { description: "Natija (foiz, to'g'ri javoblar soni, o'tdi/o'tmadi)" }
 */
router.post(
  "/:id/submit",
  authenticate,
  asyncHandler(async (req, res) => {
    const { answers } = req.body; // { questionId: chosenIndex }

    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: { questions: true },
    });
    if (!test) return res.status(404).json({ message: "Test topilmadi." });

    let correct = 0;
    for (const q of test.questions) {
      if (answers[q.id] === q.correctIndex) correct++;
    }

    const total = test.questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= test.passScore;

    const result = await prisma.testResult.create({
      data: {
        userId: req.user!.id,
        testId: test.id,
        score,
        correctAnswers: correct,
        totalQuestions: total,
        passed,
        answers,
      },
    });

    res.json(result);
  })
);

/**
 * @swagger
 * /tests/{id}/correct-answers:
 *   get:
 *     summary: "Testning to'g'ri javoblarini ko'rish (test topshirilgandan keyin)"
 *     tags: [Tests]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "To'g'ri javoblar" }
 */
router.get(
  "/:id/correct-answers",
  authenticate,
  asyncHandler(async (req, res) => {
    const questions = await prisma.question.findMany({
      where: { testId: req.params.id },
      select: { id: true, text: true, options: true, correctIndex: true },
      orderBy: { order: "asc" },
    });
    res.json(questions);
  })
);

export default router;
