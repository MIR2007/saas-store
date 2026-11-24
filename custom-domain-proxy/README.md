# بروكسي الدومينات المجاني (Netlify)

ده بديل مجاني لـ Cloudflare for SaaS لحد ما تفعّله. Netlify بيعمل شهادة SSL مجانية
(Let's Encrypt) لكل دومين تاجر، والـ Edge Function في `netlify/edge-functions/bp-proxy.ts`
بتبعت الطلب لـ `beepanal.store` ومعاه دومين التاجر في هيدر موقّع بسر مشترك.

## إزاي الطلب بيمشي

```
عميل → https://mystore.com
     → Netlify (SSL + Edge Function)
     → https://beepanal.store  + x-bp-forwarded-host: mystore.com
                               + x-bp-proxy-secret: <السر>
     → src/proxy.ts يتأكد من السر، يلاقي المتجر، ويعرضه
```

## خطوات الإعداد (مرة واحدة)

1. **اعمل سر عشوائي طويل** (40 حرف أو أكتر):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **ارفع الفولدر ده كموقع جديد على Netlify** (حساب مجاني، من غير كارت):
   - Add new site → Deploy manually، واسحب فولدر `custom-domain-proxy` كله.
   - أو اربطه بالريبو وخلي Base directory = `custom-domain-proxy`.
   - غيّر اسم الموقع لاسم ثابت، مثلًا `bp-domains` ← العنوان هيبقى `bp-domains.netlify.app`.

3. **متغيرات البيئة على Netlify** (Site configuration → Environment variables):
   | المتغير | القيمة |
   |---|---|
   | `BP_ORIGIN` | `https://beepanal.store` |
   | `BP_PROXY_SECRET` | السر من خطوة 1 |

   بعدها اعمل Deploy تاني عشان المتغيرات تتطبق.

4. **اتأكد إنه شغال**: افتح `https://bp-domains.netlify.app/.well-known/beepanal-proxy`
   لازم يرجع `{"ok":true,...}`.

5. **Token و Site ID من Netlify**:
   - Site ID: من Site configuration → General → Site details.
   - Token: User settings → Applications → Personal access tokens → New access token.

6. **IP الدومينات الأساسية (apex)**: Netlify بيطلب سجل A للدومين الأساسي (من غير www).
   خد الـ IP من صفحة Netlify Docs بعنوان «Configure external DNS» (load balancer IP)
   واتأكد منه بنفسك قبل ما تحطه — ممكن يتغير.

7. **متغيرات المنصة على Cloudflare Workers** (`wrangler secret put <NAME>`):
   | المتغير | القيمة |
   |---|---|
   | `CUSTOM_DOMAIN_PROXY_TARGET` | `bp-domains.netlify.app` |
   | `CUSTOM_DOMAIN_PROXY_SECRET` | نفس السر من خطوة 1 |
   | `CUSTOM_DOMAIN_PROXY_APEX_IP` | الـ IP من خطوة 6 |
   | `NETLIFY_API_TOKEN` | التوكن من خطوة 5 |
   | `NETLIFY_SITE_ID` | الـ Site ID من خطوة 5 |

   وبعدها `npm run deploy`.

## التاجر بيعمل إيه

من صفحة «رابط المتجر والدومين» بيكتب دومينه، وبيضيف عند شركة الدومين:
- `TXT` باسم `_beepanal-verify.mystore.com` (لإثبات الملكية)
- `A` للدومين على IP الـ load balancer بتاع Netlify (`CUSTOM_DOMAIN_PROXY_APEX_IP`)
- `A` لـ `www` على نفس الـ IP

ليه A مش CNAME؟ في التجربة من شبكات مصرية، العناوين اللي `*.netlify.app` بيروح لها
ماكانتش بتفتح خالص، لكن الـ load balancer IP (`75.2.60.5`) كان شغال. الـ CNAME على
`bp-domains.netlify.app` كان هيخلي الزباين في مصر ميفتحوش المتجر.

لما يدوس «تحقق الآن»: المنصة بتتأكد من الـ DNS، تضيف الدومين لموقع Netlify بالـ API،
تطلب شهادة SSL، وتختبر `https://mystore.com/.well-known/beepanal-proxy`.
أول ما الاختبار ينجح الدومين بيتحول لـ «متصل وشغال» أوتوماتيك.

## الرجوع لـ Cloudflare for SaaS بعدين

1. فعّل Cloudflare for SaaS وجهّز البنية من صفحة الأدمن (زي الأول).
2. امسح `CUSTOM_DOMAIN_PROXY_TARGET` من متغيرات المنصة واعمل deploy.
3. اطلب من التجار يغيروا الـ CNAME لـ `customers.beepanal.store` ويدوسوا «تحقق الآن».

## حدود لازم تعرفها

- الخطة المجانية على Netlify ليها حدود (عدد الدومينات على الموقع، وعدد مرات تشغيل
  الـ Edge Functions في الشهر، والباندويدث). راجع صفحة الأسعار عندهم.
- Netlify بيعمل شهادة واحدة لكل الدومينات على الموقع، فالمنصة مش بتضيف أي دومين
  غير لما الـ DNS بتاعه يكون موجه صح، وبتشيله لو اتغير.
- كل طلب بيعدي على Netlify الأول، فالصفحات أبطأ شوية من Cloudflare for SaaS.
