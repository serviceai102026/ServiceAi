# إصلاح اختفاء الإعلانات - 7 أكتوبر 2026

## المشكل:
- اختفت جميع مساحات الإعلانات من الموقع
- السبب: استخدام data/ads.json مع fs.writeFileSync
- Vercel يمسح ملفات fs عند كل Deploy - نظام ephemeral filesystem

## الحل النهائي:
1. حذف مجلد data/ نهائيا
2. حذف أي API يستخدم fs
3. حذف localStorage من لوحة التحكم
4. جعل lib/ads-config.ts هو المصدر الوحيد الدائم للإعلانات
5. وضع أكواد تجريبية ملونة في ADS_CONFIG لكي تظهر دائما
6. مكون AdSlot يقرأ مباشرة من ADS_CONFIG بدون return null

## الملفات المهمة:
- lib/ads-config.ts = يحتوي 6 مساحات: top, middle, bottom, blog_top, blog_middle, blog_end
- components/ads/AdSlot.tsx = يعرض الإعلان من ADS_CONFIG
- app/tools/[tool]/page.tsx = فيه 3 إعلانات
- app/blog/[slug]/page.tsx = فيه 3 إعلانات

## كيف تغير إعلان AdSense من لوحة التحكم:
1. افتح إدارة الإعلانات أو إعدادات الموقع.
2. عدّل الموضع أو فعّله، ثم أدخل رمز الكتابة السري.
3. تحفظ الواجهة `lib/ads-config.ts` في GitHub، ويبدأ Vercel نشر الموقع تلقائيا.
4. لا تستخدم أبدا `data/ads.json` أو تخزين الإعلانات في `localStorage`.

## متطلبات GitHub وVercel:
- `GITHUB_TOKEN`: رمز GitHub بصلاحية محتوى المستودع المطلوب.
- `GITHUB_REPO`: اسم المستودع بصيغة `owner/repository`.
- `ADS_CONFIG_WRITE_TOKEN`: رمز كتابة سري منفصل، مطلوب لحماية API الحفظ.
- أضف المتغيرات في إعدادات بيئة Vercel، ثم أعد نشر الموقع بعد ضبطها.

## تاريخ الإصلاح: تم بنجاح - 3 مساحات ظاهرة
