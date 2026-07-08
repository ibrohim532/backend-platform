import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Results
 *   description: "Natijalar (Progress foizi, Olingan ballar, Tugatilgan kurslar, Reyting)"
 */

/**
 * @swagger
 * /results/my:
 *   get:
 *     summary: "Joriy foydalanuvchining barcha test natijalari"
 *     tags: [Results]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Natijalar ro'yxati" }
 */
router.get(
  "/my",
  authenticate,
  asyncHandler(async (req, res) => {
    const results = await prisma.testResult.findMany({
      where: { userId: req.user!.id },
      include: { test: { select: { id: true, title: true, type: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(results);
  })
);

/**
 * @swagger
 * /results/summary:
 *   get:
 *     summary: "Foydalanuvchi uchun umumiy statistika (progress, ball, tugatilgan kurslar)"
 *     tags: [Results]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Umumiy statistika" }
 */
router.get(
  "/summary",
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const [enrollments, results, certificates] = await Promise.all([
      prisma.enrollment.findMany({ where: { userId } }),
      prisma.testResult.findMany({ where: { userId } }),
      prisma.certificate.count({ where: { userId } }),
    ]);

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter((e) => e.status === "COMPLETED").length;
    const avgProgress =
      totalCourses > 0
        ? Math.round(enrollments.reduce((s, e) => s + e.progressPercent, 0) / totalCourses)
        : 0;
    const totalScore = results.reduce((s, r) => s + r.score, 0);

    res.json({
      totalCourses,
      completedCourses,
      avgProgress,
      totalPoints: totalScore,
      totalTestsTaken: results.length,
      certificatesCount: certificates,
    });
  })
);

/**
 * @swagger
 * /results/leaderboard:
 *   get:
 *     summary: "Reyting (eng ko'p ball to'plagan o'quvchilar)"
 *     tags: [Results]
 *     responses:
 *       200: { description: "Top o'quvchilar ro'yxati" }
 */
router.get(
  "/leaderboard",
  asyncHandler(async (req, res) => {
    const results = await prisma.testResult.groupBy({
      by: ["userId"],
      _sum: { score: true },
      orderBy: { _sum: { score: "desc" } },
      take: 20,
    });

    const userIds = results.map((r) => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, avatarUrl: true },
    });

    const leaderboard = results.map((r) => ({
      user: users.find((u) => u.id === r.userId),
      totalPoints: r._sum.score || 0,
    }));

    res.json(leaderboard);
  })
);

export default router;
