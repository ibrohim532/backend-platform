import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Certificates
 *   description: "Sertifikatlar (kursni tugatgach PDF)"
 */

/**
 * @swagger
 * /certificates/my:
 *   get:
 *     summary: "Foydalanuvchining barcha sertifikatlari"
 *     tags: [Certificates]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Sertifikatlar ro'yxati" }
 */
router.get(
  "/my",
  authenticate,
  asyncHandler(async (req, res) => {
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user!.id },
      include: { course: { select: { title: true, level: true } } },
      orderBy: { issuedAt: "desc" },
    });
    res.json(certificates);
  })
);

/**
 * @swagger
 * /certificates:
 *   post:
 *     summary: "Kursni tugatgach sertifikat generatsiya qilish (kurs 100% tugagach chaqiriladi)"
 *     tags: [Certificates]
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
 *       201: { description: "Sertifikat yaratildi" }
 *       400: { description: "Kurs hali tugallanmagan" }
 */
router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user!.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!enrollment || enrollment.status !== "COMPLETED") {
      return res.status(400).json({ message: "Sertifikat olish uchun kursni 100% tugatishingiz kerak." });
    }

    // NOTE: haqiqiy PDF generatsiyasi uchun pdfkit/puppeteer kabi kutubxona
    // yoki alohida servis ulanishi mumkin. Hozircha fileUrl placeholder.
    const certificate = await prisma.certificate.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: {
        userId,
        courseId,
        fileUrl: `/certificates/${userId}-${courseId}.pdf`,
      },
    });

    res.status(201).json(certificate);
  })
);

export default router;
