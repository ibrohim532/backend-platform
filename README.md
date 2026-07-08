# English Learning Platform — Backend

Ingliz tili o'quv platformasi uchun to'liq backend API.
**Stack:** Node.js + Express + TypeScript + Prisma ORM + Neon Postgres + Swagger + JWT

## Imkoniyatlar

- 🔐 Auth (ro'yxatdan o'tish, login, JWT, role: STUDENT/TEACHER/ADMIN)
- 👤 Profil, sozlamalar, o'qituvchilar haqida ma'lumot
- 📚 Kurslar (Elementary → IELTS, Grammar, Vocabulary, Speaking)
- 🎬 Darslar (video, audio, PDF konspekt) + materiallar (vocabulary, grammar notes, homework)
- 📝 Test markazi (har darsdan keyin test, yakuniy test, natijalar, to'g'ri javoblar)
- 📊 Natijalar: progress foizi, ballar, tugatilgan kurslar, reyting (leaderboard)
- 🔴 Jonli darslar (Zoom/Google Meet, jadval, dars yozuvlari)
- ❓ Savol-javob (Q&A) + avtomatik bildirishnoma
- 🔔 Bildirishnomalar (yangi dars/test, e'lonlar)
- 🎓 Sertifikatlar (kurs tugagach)
- 💳 To'lovlar (kurs sotib olish, obuna, promo-kod, to'lovlar tarixi)
- ⭐ O'quvchilar fikrlari (testimonials)
- 📩 Bog'lanish formasi
- 📖 To'liq Swagger hujjatlari — `/api-docs`

## O'rnatish

```bash
npm install
```

## Neon Postgres ulash

1. https://neon.tech saytida bepul akkaunt oching va yangi loyiha yarating.
2. Dashboard → **Connection Details** → **Pooled connection** stringini nusxa oling.
3. `.env.example` faylini `.env` deb nusxalab, `DATABASE_URL` ni shu string bilan almashtiring:

```bash
cp .env.example .env
```

```
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

4. `JWT_SECRET` ni ham o'zingiz xohlagan tasodifiy matnga almashtiring.

## Database migratsiya

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Bu barcha jadvallarni (users, courses, lessons, tests, payments va h.k.) Neon'da avtomatik yaratadi.

### (Ixtiyoriy) Boshlang'ich ma'lumotlar bilan to'ldirish

```bash
npm run seed
```

Bu admin, o'qituvchi va bitta namuna kurs yaratadi:
- admin@platform.uz / password123
- teacher@platform.uz / password123

## Ishga tushirish

```bash
npm run dev
```

Server: `http://localhost:5000`
Swagger hujjatlari: `http://localhost:5000/api-docs`

## Production build

```bash
npm run build
npm start
```

## Papka strukturasi

```
src/
  config/swagger.ts        # Swagger sozlamalari
  lib/prisma.ts            # Prisma client
  middleware/               # auth, error handling
  utils/                    # jwt, asyncHandler
  modules/
    auth/                   # register, login, /me
    users/                  # profil, sozlamalar, o'qituvchilar
    courses/                # kurslar CRUD
    lessons/                # video/audio/pdf darslar
    materials/              # vocabulary, grammar, homework
    tests/                  # test markazi, submit, natija
    results/                # progress, ball, reyting
    enrollments/            # "Kurslarim"
    certificates/           # sertifikatlar
    payments/               # to'lov, promo-kod
    liveLessons/            # Zoom/Meet jonli darslar
    qna/                    # savol-javob
    notifications/          # bildirishnomalar
    testimonials/           # o'quvchilar fikrlari
    contact/                # bog'lanish formasi
  app.ts                    # Express app + barcha route'lar
  server.ts                 # kirish nuqtasi
prisma/
  schema.prisma             # to'liq database sxemasi
  seed.ts                   # boshlang'ich ma'lumotlar
```

## Muhim eslatmalar

- **Fayl saqlash**: video/audio/pdf/rasm fayllari uchun hozircha faqat URL maydonlari bor.
  Ishlab chiqarishda fayllarni Cloudinary, AWS S3 yoki shunga o'xshash storage'ga
  yuklab, uning URL'ini shu maydonlarga saqlash tavsiya etiladi.
- **To'lov provayderi**: `payments` modulida Click/Payme/Stripe kabi haqiqiy
  to'lov tizimi bilan integratsiya qilinmagan — bu joyga webhook handler
  qo'shishingiz kerak bo'ladi (`/payments/:id/confirm` shu vazifani bajaradi).
- **Sertifikat PDF generatsiyasi**: hozircha placeholder URL qaytariladi.
  Haqiqiy PDF yaratish uchun `pdfkit` yoki `puppeteer` kutubxonasini
  qo'shish mumkin.
- Barcha himoyalangan endpointlar uchun header: `Authorization: Bearer <token>`
# backend-platform
# backend-platform
