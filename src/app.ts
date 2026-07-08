import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware";

import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import coursesRoutes from "./modules/courses/courses.routes";
import lessonsRoutes from "./modules/lessons/lessons.routes";
import materialsRoutes from "./modules/materials/materials.routes";
import testsRoutes from "./modules/tests/tests.routes";
import resultsRoutes from "./modules/results/results.routes";
import enrollmentsRoutes from "./modules/enrollments/enrollments.routes";
import certificatesRoutes from "./modules/certificates/certificates.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import liveLessonsRoutes from "./modules/liveLessons/liveLessons.routes";
import qnaRoutes from "./modules/qna/qna.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import testimonialsRoutes from "./modules/testimonials/testimonials.routes";
import contactRoutes from "./modules/contact/contact.routes";

const app = express();

// ==================== GLOBAL MIDDLEWARE ====================
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ==================== SWAGGER ====================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

// ==================== HEALTH CHECK ====================
app.get("/", (req, res) => {
  res.json({
    message: "English Learning Platform API ishlamoqda 🚀",
    docs: "/api-docs",
  });
});

// ==================== ROUTES ====================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/lessons", lessonsRoutes);
app.use("/api/materials", materialsRoutes);
app.use("/api/tests", testsRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api/certificates", certificatesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/live-lessons", liveLessonsRoutes);
app.use("/api/qna", qnaRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/testimonials", testimonialsRoutes);
app.use("/api/contact", contactRoutes);

// ==================== ERROR HANDLING ====================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
