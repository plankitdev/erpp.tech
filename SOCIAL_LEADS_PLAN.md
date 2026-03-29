# خطة تطوير: إدارة السوشيال ميديا + ربط الليدز

> تاريخ الإنشاء: 29 مارس 2026  
> الحالة: تخطيط

---

## الفكرة الأولى: نظام إدارة وجدولة محتوى السوشيال ميديا

### الهدف
نظام متكامل لإنشاء ومراجعة وجدولة البوستات لعملاء السوشيال ميديا مباشرة من الـ ERP، مع إمكانية النشر التلقائي بعد موافقة العميل.

### المراحل

#### المرحلة 1: Content Calendar + Approval System (بدون ربط API)

**Backend — جداول قاعدة البيانات:**

```
social_accounts
├── id
├── company_id
├── client_id (FK → clients)
├── platform (facebook | instagram | tiktok | twitter | linkedin)
├── account_name
├── account_url
├── page_id (nullable — يتملأ لما نربط API)
├── access_token (nullable, encrypted)
├── token_expires_at (nullable)
├── status (active | disconnected | pending)
├── created_at / updated_at

social_posts
├── id
├── company_id
├── client_id (FK → clients)
├── created_by (FK → users)
├── title (عنوان داخلي للتنظيم)
├── content (نص البوست)
├── content_ar (نص عربي إن فيه نسخة تانية)
├── hashtags (JSON array)
├── platforms (JSON array — ["facebook", "instagram"])
├── media (JSON array — مسارات الصور/الفيديوهات)
├── media_type (image | video | carousel | story | reel)
├── scheduled_at (datetime — موعد النشر)
├── published_at (datetime — تم النشر فعلاً)
├── status (draft | pending_review | approved | scheduled | published | failed | rejected)
├── rejection_reason (nullable)
├── notes (ملاحظات داخلية)
├── created_at / updated_at
├── deleted_at (soft delete)

social_post_approvals
├── id
├── social_post_id (FK → social_posts)
├── approved_by (FK → users, nullable — ممكن العميل من بوابة)
├── client_approved (boolean)
├── approval_token (string, unique — لينك الموافقة للعميل)
├── token_expires_at (datetime)
├── status (pending | approved | rejected)
├── feedback (ملاحظات العميل)
├── approved_at / rejected_at
├── created_at

social_post_platforms (pivot — لو بوست اتنشر على أكتر من منصة)
├── id
├── social_post_id
├── social_account_id
├── platform_post_id (nullable — ID البوست على المنصة بعد النشر)
├── status (pending | published | failed)
├── error_message (nullable)
├── published_at
```

**Backend — Controllers & APIs:**

```
SocialAccountController
├── GET    /api/social-accounts                → قائمة الحسابات
├── POST   /api/social-accounts                → إضافة حساب
├── PUT    /api/social-accounts/{id}           → تعديل
├── DELETE /api/social-accounts/{id}           → حذف

SocialPostController
├── GET    /api/social-posts                   → قائمة البوستات (فلترة بالعميل/الحالة/التاريخ)
├── GET    /api/social-posts/calendar          → بوستات بصيغة تقويم (start/end)
├── POST   /api/social-posts                   → إنشاء بوست جديد
├── PUT    /api/social-posts/{id}              → تعديل
├── DELETE /api/social-posts/{id}              → حذف
├── POST   /api/social-posts/{id}/submit       → إرسال للمراجعة
├── POST   /api/social-posts/{id}/approve      → موافقة داخلية
├── POST   /api/social-posts/{id}/reject       → رفض
├── POST   /api/social-posts/{id}/send-approval → إرسال لينك موافقة للعميل
├── POST   /api/social-posts/{id}/duplicate    → نسخ بوست

SocialApprovalController (Public — بدون auth)
├── GET    /api/public/social-approval/{token} → عرض البوست للعميل
├── POST   /api/public/social-approval/{token} → العميل يوافق أو يرفض
```

**Frontend — صفحات جديدة:**

```
pages/
├── SocialCalendar.tsx          → تقويم المحتوى (شهري/أسبوعي) مع drag & drop
├── SocialPosts.tsx             → قائمة البوستات مع فلاتر
├── SocialPostEditor.tsx        → محرر البوست (نص + ميديا + preview لكل منصة)
├── SocialAccounts.tsx          → إدارة حسابات السوشيال للعملاء
├── SocialApprovalPublic.tsx    → صفحة الموافقة العامة (للعميل بدون تسجيل دخول)

components/
├── PostPreview.tsx             → معاينة شكل البوست على كل منصة
├── MediaUploader.tsx           → رفع صور وفيديوهات مع crop/resize
├── HashtagSuggestions.tsx      → اقتراح هاشتاجات
├── ContentCalendarView.tsx     → عرض التقويم
├── ApprovalStatusBadge.tsx     → بادج حالة الموافقة
```

**الصلاحيات الجديدة:**

```
social.view          → عرض البوستات والتقويم
social.create        → إنشاء بوست
social.edit          → تعديل بوست
social.delete        → حذف بوست
social.approve       → موافقة داخلية على البوست
social.publish       → نشر مباشر (المرحلة 2)
social.accounts      → إدارة حسابات السوشيال
```

---

#### المرحلة 2: ربط API للنشر التلقائي

**المنصات والـ APIs المطلوبة:**

| المنصة | الـ API | المطلوب | ملاحظات |
|--------|---------|---------|---------|
| Facebook | Meta Graph API v19+ | `pages_manage_posts`, `pages_read_engagement` | محتاج Meta App Review |
| Instagram | Meta Graph API (Instagram) | `instagram_basic`, `instagram_content_publish` | نفس الـ Meta App — الحساب لازم Business/Creator |
| TikTok | TikTok Content Posting API | `video.publish` | محتاج TikTok Developer App مع capability: "Direct Post" |

**Backend — Services جديدة:**

```
Services/
├── Social/
│   ├── SocialPublisher.php          → الـ main service اللي بيوزّع على المنصات
│   ├── FacebookPublisher.php        → نشر على فيسبوك
│   ├── InstagramPublisher.php       → نشر على انستجرام
│   ├── TikTokPublisher.php          → نشر على تيك توك
│   ├── TokenRefreshService.php      → تجديد التوكنات تلقائياً
│   └── SocialAnalyticsService.php   → سحب إحصائيات بعد النشر

Jobs/
├── PublishSocialPost.php            → Queue Job — بينشر البوست في الموعد المجدول
├── RefreshSocialTokens.php          → يتشغل يومياً لتجديد التوكنات
├── FetchPostAnalytics.php           → يسحب الإحصائيات بعد 24 ساعة من النشر
```

**OAuth Flow (لربط الحسابات):**

```
المستخدم يضغط "ربط فيسبوك"
    → redirect لـ Facebook OAuth
    → Facebook يرجّع code
    → Backend يبدّل الـ code بـ access_token
    → يتخزن مشفّر في social_accounts
    → يتعمل refresh تلقائي قبل انتهاء الصلاحية
```

**Laravel Scheduler (إضافات):**

```php
// نشر البوستات المجدولة كل دقيقة
Schedule::command('social:publish-scheduled')->everyMinute();

// تجديد التوكنات يومياً
Schedule::command('social:refresh-tokens')->dailyAt('03:00');

// سحب الإحصائيات للبوستات المنشورة
Schedule::command('social:fetch-analytics')->dailyAt('06:00');
```

---

## الفكرة التانية: ربط الليدز (واتساب + موقع)

### A. ليدز الموقع (Website Leads)

**Backend:**

```
LeadWebhookController (Public — بدون auth)
├── POST /api/public/leads          → استقبال ليد من أي مصدر خارجي
├── POST /api/public/leads/website  → استقبال من فورم الموقع (مع CAPTCHA)

WebLeadFormController
├── GET  /api/lead-forms             → قائمة الفورمات لكل عميل
├── POST /api/lead-forms             → إنشاء فورم جديد
├── GET  /api/lead-forms/{id}/embed  → كود الـ embed (JavaScript snippet)
```

**جدول جديد:**

```
lead_forms
├── id
├── company_id
├── client_id (nullable — لو الفورم لعميل معين)
├── name (اسم الفورم)
├── fields (JSON — الحقول المطلوبة: name, phone, email, message, service...)
├── redirect_url (nullable — بعد الإرسال يروح فين)
├── notification_emails (JSON — إيميلات تتبّلغ)
├── auto_assign_to (FK → users, nullable)
├── source_tag (يتسجل كمصدر الليد: "website_form_1")
├── api_key (unique — مفتاح للتحقق)
├── is_active (boolean)
├── created_at / updated_at
```

**JavaScript Embed Code (يتحط في موقع العميل):**

```html
<!-- ERPFlex Lead Form -->
<div id="erpflex-lead-form"></div>
<script>
  (function() {
    var API = 'https://erpp.tech/api/public/leads/website';
    var KEY = 'FORM_API_KEY_HERE';
    // ... يعمل render لفورم بسيط ويبعت البيانات
  })();
</script>
```

**أو Webhook بسيط (لو العميل عنده فورم جاهز):**

```bash
POST https://erpp.tech/api/public/leads
Content-Type: application/json
X-API-Key: FORM_API_KEY

{
  "name": "أحمد محمد",
  "phone": "01012345678",
  "email": "ahmed@example.com",
  "service_type": "marketing",
  "source": "website",
  "notes": "مهتم بخدمة إدارة السوشيال"
}
```

**أمان:**
- Rate limiting: 10 requests/minute per API key
- CAPTCHA (reCAPTCHA v3 أو hCaptcha) للفورم المضمّن
- تنظيف المدخلات (sanitize) لمنع XSS/injection
- الـ API Key لازم يتبعت في الـ header

---

### B. ليدز الواتساب (WhatsApp Leads)

**الطريقة الموصى بيها: Meta Cloud API (مجاني)**

**Backend:**

```
WhatsAppWebhookController
├── GET  /api/webhooks/whatsapp     → Webhook Verification (Meta بيتحقق)
├── POST /api/webhooks/whatsapp     → استقبال الرسائل الواردة

WhatsAppConfigController
├── GET  /api/whatsapp/config       → إعدادات الواتساب
├── PUT  /api/whatsapp/config       → تحديث الإعدادات
├── POST /api/whatsapp/test         → إرسال رسالة تجريبية

WhatsAppMessageController
├── GET  /api/whatsapp/messages              → سجل الرسائل
├── POST /api/whatsapp/messages/{lead}/send  → إرسال رسالة لليد
```

**جداول جديدة:**

```
whatsapp_configs
├── id
├── company_id
├── phone_number_id (من Meta)
├── whatsapp_business_account_id
├── access_token (encrypted)
├── webhook_verify_token
├── is_active
├── auto_create_lead (boolean — يعمل ليد تلقائي للأرقام الجديدة)
├── auto_assign_to (FK → users, nullable)
├── created_at / updated_at

whatsapp_messages
├── id
├── company_id
├── lead_id (FK → leads, nullable)
├── client_id (FK → clients, nullable)
├── wa_message_id (ID من واتساب)
├── direction (inbound | outbound)
├── from_number
├── to_number
├── message_type (text | image | document | audio | video | template)
├── content (نص الرسالة)
├── media_url (nullable)
├── template_name (nullable — لو رسالة template)
├── status (sent | delivered | read | failed)
├── sent_at
├── created_at
```

**الفلو:**

```
1. عميل يبعت رسالة على رقم الواتساب
2. Meta Cloud API يبعت Webhook لـ /api/webhooks/whatsapp
3. النظام يدوّر على الرقم في الليدز والعملاء:
   → رقم جديد → يعمل Lead جديد (source: whatsapp, temperature: hot)
   → رقم موجود → يضيف Activity + يحفظ الرسالة
4. إشعار فوري للموظف المسؤول
5. الموظف يقدر يرد من الـ ERP (الرد بيتبعت عبر WhatsApp API)
```

**Auto-Reply (اختياري):**

```
لو أول رسالة من رقم جديد:
    → رد تلقائي: "مرحباً! تم استلام رسالتك وسيتم التواصل معك قريباً. فريق [اسم الشركة]"
    → يتعمل ليد جديد فوراً
```

---

## ترتيب التنفيذ المقترح

| الأولوية | المرحلة | الوصف | التبعيات الخارجية |
|----------|---------|-------|-------------------|
| **1** | ليدز الموقع | Public API + Embed Form + Auto-assign | لا شيء — جاهز للتنفيذ |
| **2** | Content Calendar | تقويم محتوى + إنشاء بوست + مراجعة + موافقة عميل | لا شيء — جاهز للتنفيذ |
| **3** | ليدز الواتساب | Webhook + ربط بالليدز + رد من ERP | Meta Business Account + Phone Number |
| **4** | نشر السوشيال (Facebook + Instagram) | OAuth + نشر تلقائي + إحصائيات | Meta App Review (2-4 أسابيع) |
| **5** | نشر السوشيال (TikTok) | OAuth + نشر | TikTok Developer Access |

---

## المطلوب من العميل (التجهيزات الخارجية)

### لربط الواتساب:
- [ ] Meta Business Account (https://business.facebook.com)
- [ ] رقم واتساب Business مخصص (مش مربوط بتطبيق واتساب عادي)
- [ ] تفعيل WhatsApp في Meta Business Settings
- [ ] إنشاء Meta App من Facebook Developers

### لربط الفيسبوك + انستجرام (المرحلة 4):
- [ ] Facebook Page لكل عميل 
- [ ] Instagram Business/Creator Account مربوط بالـ Facebook Page
- [ ] Meta App Review — تقديم طلب لصلاحيات النشر

### لربط تيك توك (المرحلة 5):
- [ ] TikTok Developer Account (https://developers.tiktok.com)
- [ ] تقديم طلب Direct Post capability
- [ ] TikTok Business Accounts للعملاء

### لليدز من الموقع:
- [ ] لا شيء — فقط يتحط كود JavaScript في موقع العميل أو يتعمل Webhook من الفورم الموجود
