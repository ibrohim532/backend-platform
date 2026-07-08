import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: "To'lov (Kurs sotib olish, Obuna, Promo-kod), To'lovlar tarixi"
 */

/**
 * @swagger
 * /payments/my:
 *   get:
 *     summary: "Foydalanuvchining to'lovlar tarixi"
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "To'lovlar ro'yxati" }
 */
router.get(
  "/my",
  authenticate,
  asyncHandler(async (req, res) => {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      include: { course: { select: { title: true, thumbnailUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(payments);
  })
);

/**
 * @swagger
 * /payments/checkout:
 *   post:
 *     summary: "Kurs sotib olish / obuna bo'lish (promo-kod bilan)"
 *     tags: [Payments]
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
 *               promoCode: { type: string }
 *               provider: { type: string, example: "click" }
 *     responses:
 *       201: { description: "To'lov yaratildi (PENDING holatda)" }
 *       404: { description: "Kurs topilmadi" }
 */
router.post(
  "/checkout",
  authenticate,
  asyncHandler(async (req, res) => {
    const { courseId, promoCode, provider } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: "Kurs topilmadi." });

    let amount = Number(course.price);

    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: promoCode } });
      if (promo && promo.isActive && (!promo.expiresAt || promo.expiresAt > new Date())) {
        amount = amount - (amount * promo.discountPercent) / 100;
      }
    }

    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        courseId,
        amount,
        promoCode,
        provider,
        status: "PENDING",
        type: "COURSE",
      },
    });

    // NOTE: bu yerda haqiqiy to'lov provayderi (Click, Payme, Stripe)
    // bilan integratsiya qilinadi va webhook orqali status yangilanadi.
    res.status(201).json(payment);
  })
);

/**
 * @swagger
 * /payments/{id}/confirm:
 *   put:
 *     summary: "To'lovni tasdiqlash (webhook yoki admin tomonidan, avtomatik kursga yozadi)"
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "To'lov tasdiqlandi va kursga yozildi" }
 */
router.put(
  "/:id/confirm",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { status: "SUCCESS" },
    });

    if (payment.courseId) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
        update: {},
        create: { userId: payment.userId, courseId: payment.courseId },
      });
    }

    res.json(payment);
  })
);

/**
 * @swagger
 * /payments/promo/{code}:
 *   get:
 *     summary: "Promo-kodni tekshirish"
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Promo-kod ma'lumotlari" }
 *       404: { description: "Yaroqsiz promo-kod" }
 */
router.get(
  "/promo/:code",
  asyncHandler(async (req, res) => {
    const promo = await prisma.promoCode.findUnique({ where: { code: req.params.code } });
    if (!promo || !promo.isActive || (promo.expiresAt && promo.expiresAt < new Date())) {
      return res.status(404).json({ message: "Yaroqsiz yoki muddati o'tgan promo-kod." });
    }
    res.json(promo);
  })
);

export default router;
