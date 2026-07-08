import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Testimonials
 *   description: "O'quvchilar fikrlari (Landing sahifa uchun)"
 */

/**
 * @swagger
 * /testimonials:
 *   get:
 *     summary: "Tasdiqlangan fikrlar ro'yxati (Landing sahifa uchun)"
 *     tags: [Testimonials]
 *     responses:
 *       200: { description: "Fikrlar ro'yxati" }
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const testimonials = await prisma.testimonial.findMany({
      where: { isPublished: true },
      include: { user: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(testimonials);
  })
);

/**
 * @swagger
 * /testimonials:
 *   post:
 *     summary: "Yangi fikr qoldirish (admin tasdiqlashi kerak)"
 *     tags: [Testimonials]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text, rating]
 *             properties:
 *               text: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *     responses:
 *       201: { description: "Fikr yuborildi, tasdiqlanishi kutilmoqda" }
 */
router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { text, rating } = req.body;
    const testimonial = await prisma.testimonial.create({
      data: { text, rating, userId: req.user!.id },
    });
    res.status(201).json(testimonial);
  })
);

/**
 * @swagger
 * /testimonials/{id}/publish:
 *   put:
 *     summary: "Fikrni saytda chiqishga tasdiqlash (faqat ADMIN)"
 *     tags: [Testimonials]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Tasdiqlandi" }
 */
router.put(
  "/:id/publish",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const testimonial = await prisma.testimonial.update({
      where: { id: req.params.id },
      data: { isPublished: true },
    });
    res.json(testimonial);
  })
);

export default router;
