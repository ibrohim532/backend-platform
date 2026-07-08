import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, authorize } from "../../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: "Bog'lanish uchun forma (Telegram, Telefon, Email)"
 */

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: "Savol yuborish formasi (login talab qilinmaydi)"
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, message]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               message: { type: string }
 *     responses:
 *       201: { description: "Xabar yuborildi" }
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({ message: "name va message majburiy." });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: { name, email, phone, message },
    });

    res.status(201).json({ message: "Xabaringiz yuborildi, tez orada bog'lanamiz.", contactMessage });
  })
);

/**
 * @swagger
 * /contact:
 *   get:
 *     summary: "Barcha xabarlar (faqat ADMIN)"
 *     tags: [Contact]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Xabarlar ro'yxati" }
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
    res.json(messages);
  })
);

export default router;
