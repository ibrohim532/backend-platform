import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@platform.uz" },
    update: {},
    create: {
      fullName: "Admin",
      email: "admin@platform.uz",
      password,
      role: "ADMIN",
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@platform.uz" },
    update: {},
    create: {
      fullName: "Malika Yusupova",
      email: "teacher@platform.uz",
      password,
      role: "TEACHER",
      bio: "8 yillik tajribaga ega ingliz tili o'qituvchisi, IELTS 8.5",
      experience: "8 yil",
    },
  });

  const course = await prisma.course.create({
    data: {
      title: "Elementary - Boshlang'ich daraja",
      description: "Ingliz tilini noldan boshlash uchun mo'ljallangan kurs",
      level: "ELEMENTARY",
      price: 150000,
      teacherId: teacher.id,
      lessons: {
        create: [
          { title: "1-dars: Alifbo va tanishish", order: 1 },
          { title: "2-dars: Oddiy gaplar tuzish", order: 2 },
        ],
      },
    },
  });

  console.log("✅ Seed muvaffaqiyatli bajarildi:", { admin: admin.email, teacher: teacher.email, course: course.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
