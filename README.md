# Bee Panal — منصة إنشاء المتاجر الإلكترونية

Next.js 16 + Tailwind + Prisma (PostgreSQL) — تعمل على **Cloudflare Workers** عبر `@opennextjs/cloudflare`.

## الروابط الحالية

- المنصة: https://beepanal.store
- متجر تجريبي: https://livestore.beepanal.store
- نسخة العامل: https://bee-panal.ammaryassr1012007.workers.dev

## التشغيل المحلي

1. أنشئ قاعدة بيانات PostgreSQL (Neon / Supabase).
2. انسخ `.env.example` إلى `.env` واملأ `DATABASE_URL` و `AUTH_SECRET`.
3. شغّل:
   ```bash
   npm install
   npx prisma db push
   npm run dev
   ```
4. افتح http://localhost:3000

## معاينة نسخة Cloudflare محليًا

```bash
cp .dev.vars.example .dev.vars   # املأ DATABASE_URL و AUTH_SECRET
npm run preview                  # OpenNext build + wrangler dev
```

## النشر على Cloudflare

1. سجّل الدخول:
   ```bash
   npx wrangler login
   ```
2. أنشئ KV namespace للصور (R2 غير مطلوب حاليًا):
   ```bash
   npx wrangler kv namespace create UPLOADS_KV
   ```
   ثم ضع الـ `id` في `wrangler.jsonc`.
3. أضف الأسرار (Secrets):
   ```bash
   npx wrangler secret put DATABASE_URL
   npx wrangler secret put AUTH_SECRET
   npx wrangler secret put CLOUDFLARE_ZONE_ID     # Zone ID لـ beepanal.store
   npx wrangler secret put CLOUDFLARE_API_TOKEN   # مطلوب لربط الدومينات تلقائيًا
   ```
4. انشر:
   ```bash
   npm run deploy
   ```

`wrangler.jsonc` يحتوي على Worker routes للدومين:
- `beepanal.store/*`
- `*.beepanal.store/*`

## الدومينات المخصصة

- كل متجر يحصل تلقائيًا على `{slug}.beepanal.store`.
- الدومينات المخصصة تُدار عبر **Cloudflare for SaaS**:
  - fallback origin: `customers.beepanal.store`
  - التاجر يضيف `CNAME` إلى `customers.beepanal.store` + سجلات TXT للتحقق.
  - لو `CLOUDFLARE_API_TOKEN` و `CLOUDFLARE_ZONE_ID` مضبوطين، يتم إنشاء Custom Hostname تلقائيًا.
  - بدون توكن: الدومين يُحفظ بحالة `pending` ويتم تفعيله يدويًا من Cloudflare.
- صلاحيات التوكن المطلوبة: `Zone:DNS:Edit` + `Zone:Zone:Read` + `Zone:SSL and Certificates:Edit`، ومحصورة على zone `beepanal.store`.

## متغيرات البيئة

- `DATABASE_URL` — PostgreSQL connection string (Neon).
- `AUTH_SECRET` — سر عشوائي (`openssl rand -base64 32`).
- `CLOUDFLARE_API_TOKEN` — توكن Cloudflare مقيّد بالصلاحيات أعلاه (اختياري لكن مطلوب للربط التلقائي).
- `CLOUDFLARE_ZONE_ID` — Zone ID لـ `beepanal.store`.

## ملاحظات تقنية

- Prisma يستخدم `@prisma/adapter-neon` في وضع **HTTP** لأن Workers يعيد استخدام الـ isolate بين الطلبات.
- لا توجد interactive transactions؛ إنشاء الطلبات يتم بخطوات متتابعة مع تعويض يدوي عند فشل المخزون.
- الصور تُرفع إلى R2 لو كان مربوطًا، وإلا إلى `UPLOADS_KV`، وتُخدم من `/api/uploads/...` على كل الدومينات.
- الـ middleware لا يتصل بقاعدة البيانات مباشرة؛ يحل الدومينات المخصصة عبر `/api/public/resolve-domain`.
- `npm run build` يبني Next.js فقط. `npm run build:cf` يبني حزمة OpenNext.
- على Windows، سكربت `scripts/patch-opennext.mjs` يضيف fallback للـ junctions أثناء البناء (يعمل تلقائيًا في `postinstall`).

## الرجوع لـ Vercel

نشر Vercel القديم ما زال موجودًا كخطة احتياطية، لكن الدومين `beepanal.store` أصبح على Cloudflare. للرجوع:
أعد Nameservers القديمة عند Hostinger (`ns1.vercel-dns.com` / `ns2.vercel-dns.com`) أو استخدم نطاق Vercel المؤقت.
