# ايزي اوردر — منصة إنشاء المتاجر الإلكترونية

Next.js 16 + Tailwind + Prisma (PostgreSQL).

## تشغيل محلياً

1. أنشئ قاعدة بيانات PostgreSQL مجانية (Neon / Supabase).
2. انسخ `.env.example` إلى `.env` واملأ `DATABASE_URL`.
3. شغّل:
   ```bash
   npm install
   npx prisma db push
   npm run dev
   ```
4. افتح http://localhost:3000

## نشر على Vercel (مجاني + دومين خاص)

1. ارفع المشروع إلى GitHub.
2. في Vercel: Import Project → اختر المستودع.
3. في Settings → Environment Variables أضف `DATABASE_URL` (من Neon/Supabase) و `AUTH_SECRET`.
4. Vercel سيشغّل `prisma generate && next build` تلقائياً.
5. في Domains أضف دومينك (Vercel يوفر SSL مجاناً).
6. (أول مرة) شغّل محلياً `npx prisma db push` بـ DATABASE_URL الإنتاجي لإنشاء الجداول، أو أضفها كـ build command: `prisma db push && prisma generate && next build`.

## Cloudflare (D1 + SQLite)؟

**ممكن، لكن متقدم.** Cloudflare Pages (أو Workers) runs on Edge runtime، والـ Prisma client (binary engine) لا يعمل there. يتطلب:

1. `@prisma/adapter-d1` + توليد client متوافق مع edge.
2. `export const runtime = 'edge'` في كل route/page.
3. الوصول إلى binding `env.DB` عبر `getRequestContext()` (من `@cloudflare/next-on-pages`).
4. نشر عبر `wrangler pages deploy` أو OpenNext (`@opennextjs/cloudflare`).

**الواقع:** many developers fail deploying Next.js+Prisma on Cloudflare Pages (see OpenNext docs). الـ recommended path for a beginner is **Vercel + Neon** (أعلاه).

إذا أردت attempt Cloudflare، سأحتاج إلى:
- إعادة المشروع إلى SQLite.
- تثبيت `@cloudflare/next-on-pages`, `wrangler`, `@prisma/adapter-d1`.
- إعادة كتابة `src/lib/prisma.ts` كـ factory يأخذ D1 binding.
- إضافة `runtime = 'edge'` لـ ~20 ملف.
- إعداد `wrangler.toml` بـ D1 binding.

أخبرني "نعم، أنفذ Cloudflare" وأقوم بذلك (قد يتطلب debugging). وإلا، استخدم Vercel + Neon.

## متغيرات البيئة

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — سر عشوائي (openssl rand -base64 32)