import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "English Learning Platform API",
      version: "1.0.0",
      description:
        "Ingliz tili o'quv platformasi uchun backend API hujjatlari. " +
        "Kurslar, darslar, testlar, sertifikatlar, to'lovlar, jonli darslar va boshqalar.",
    },
    servers: [
      {
        url: "https://backend-platform-2.onrender.com/",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Swagger izohlari route fayllarining tepasida JSDoc formatida yoziladi
  apis: ["./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
