# خطة التحسينات والإضافات المقترحة — ERPFlex

> تاريخ الإنشاء: 29 مارس 2026  
> الحالة: تخطيط

---

## 1. Rate Limiting (أمان — أولوية فورية)

### المشكلة
الـ API مفيهوش حماية من الطلبات المتكررة — أي حد يقدر يعمل brute force على الـ login أو يغرق الـ endpoints بطلبات.

### الحل
```
Backend:
├── تفعيل Laravel Rate Limiting في RouteServiceProvider / bootstrap
│   ├── Login: 5 محاولات / دقيقة per IP
│   ├── API عام: 60 طلب / دقيقة per user
│   ├── Public endpoints (leads webhook): 10 / دقيقة per API key
│   └── File upload: 10 / دقيقة per user
├── إضافة middleware `throttle` على routes
└── رسائل خطأ عربية (429 Too Many Requests)
```

### التأثير: أمان حرج  
### الصعوبة: سهل جداً (ساعة واحدة)

---

## 2. Audit Trail — سجل تغييرات شامل

### المشكلة
فيه `LogsActivity` trait على بعض الموديلز بس مفيش صفحة موحّدة تعرض: مين عدّل إيه ومتى.

### الحل

**Backend:**
```
├── تحسين ActivityLog model
│   ├── تسجيل القيمة القديمة والجديدة (old_values, new_values JSON)
│   ├── تسجيل IP + User Agent
│   └── تسجيل العمليات الحساسة (حذف، تعديل أسعار، تغيير صلاحيات)
├── AuditController
│   ├── GET /api/audit-logs — مع فلترة (user, model, action, date range)
│   └── GET /api/audit-logs/{model}/{id} — سجل تغييرات عنصر معين
└── تطبيق LogsActivity على كل الموديلز المهمة:
    ├── Invoice, Contract, Client, Employee, User
    ├── Lead, Project, Task, Salary
    └── Treasury, Expense, Partner
```

**Frontend:**
```
├── pages/AuditLog.tsx — صفحة سجل التغييرات
│   ├── جدول: التاريخ | المستخدم | العملية | العنصر | التفاصيل
│   ├── فلاتر: نوع العملية، المستخدم، التاريخ
│   ├── عرض diff (القيمة القديمة → الجديدة) بألوان
│   └── Export CSV
├── إضافة tab "سجل التغييرات" في صفحات التفاصيل:
│   ├── تفاصيل العميل → tab يعرض كل التعديلات
│   ├── تفاصيل المشروع → tab يعرض التغييرات
│   └── تفاصيل الفاتورة → مين عدّل المبلغ ومتى
```

### التأثير: محاسبة + مسؤولية + ثقة  
### الصعوبة: متوسط

---

## 3. Dashboard مخصص لكل Role

### المشكلة
الداشبورد الحالي واحد لكل الأدوار — الموظف يشوف نفس الأرقام اللي المدير يشوفها.

### الحل

**المدير (manager):**
```
├── إجمالي الإيرادات والمصروفات (شهري + سنوي)
├── عدد العملاء الجدد هذا الشهر
├── ليدز جديدة + Pipeline overview
├── أداء الفريق (مهام منجزة لكل موظف)
├── رصيد الخزنة
├── فواتير متأخرة + تحصيلات متوقعة
├── عقود قاربت على الانتهاء
└── Chart: إيرادات آخر 6 شهور
```

**المحاسب (accountant):**
```
├── فواتير متأخرة السداد (بارزة)
├── تحصيلات اليوم / هذا الأسبوع
├── مصروفات الشهر بالتصنيف
├── رصيد الخزنة + حركات اليوم
├── أقساط مستحقة قريباً
└── Chart: التدفق النقدي
```

**المبيعات (sales):**
```
├── ليدز جديدة (ساخنة أولاً)
├── Pipeline: كام ليد في كل مرحلة
├── Sales target vs actual (لو فيه أهداف)
├── عملاء يحتاجوا متابعة
├── آخر العروض المرسلة
└── Chart: تحويلات الشهر
```

**الموظف (employee):**
```
├── مهامي المفتوحة (حسب الأولوية)
├── مشاريعي النشطة
├── حضوري هذا الشهر
├── إشعاراتي الأخيرة
├── اجتماعات اليوم
└── تقويم مهامي
```

**التنفيذ:**
```
Frontend:
├── components/dashboards/
│   ├── ManagerDashboard.tsx
│   ├── AccountantDashboard.tsx
│   ├── SalesDashboard.tsx
│   └── EmployeeDashboard.tsx
├── pages/Dashboard.tsx — يحدد الـ role ويعرض الداشبورد المناسب

Backend:
├── DashboardController — endpoints مخصصة لكل role
│   ├── GET /api/dashboard/manager
│   ├── GET /api/dashboard/accountant
│   ├── GET /api/dashboard/sales
│   └── GET /api/dashboard/employee
```

### التأثير: تجربة مستخدم أفضل  
### الصعوبة: متوسط

---

## 4. Email Notifications (إشعارات بالإيميل)

### المشكلة
كل الإشعارات in-app فقط — لو المستخدم مش فاتح الـ ERP مش هيعرف إن فيه فاتورة متأخرة أو ليد ساخن.

### الحل

**أنواع الإيميلات:**

| النوع | التوقيت | المستقبل |
|-------|---------|---------|
| فاتورة متأخرة | فوري + تذكير يومي | المحاسب + المدير |
| ليد ساخن جديد | فوري | المبيعات + المدير |
| مهمة مستحقة غداً | يومي الساعة 9 صباحاً | الموظف المسؤول |
| عقد ينتهي خلال 7 أيام | مرة واحدة | المدير |
| تقرير يومي ملخص | يومي الساعة 8 صباحاً | المدير |
| تقرير أسبوعي | كل أحد | المدير |
| العميل: فاتورة جديدة | فوري | العميل (إيميله) |
| العميل: تحديث مشروع | فوري | العميل |

**Backend:**
```
├── Mail/ (Laravel Mailable classes)
│   ├── InvoiceOverdueMail.php
│   ├── NewHotLeadMail.php
│   ├── TaskDueTomorrowMail.php
│   ├── ContractExpiringMail.php
│   ├── DailyDigestMail.php
│   ├── WeeklyReportMail.php
│   ├── ClientInvoiceMail.php
│   └── ClientProjectUpdateMail.php
├── إضافة email templates (Blade views) بتصميم احترافي عربي RTL
├── إعدادات في Settings: المستخدم يقدر يختار أنهي إيميلات يستقبلها
├── جدول notification_preferences:
│   ├── user_id, notification_type, email_enabled, push_enabled, in_app_enabled
│
├── Commands/ (Scheduled)
│   ├── SendDailyDigest.php → يتشغل يومياً 8 صباحاً
│   └── SendWeeklyReport.php → يتشغل كل أحد
```

**Frontend:**
```
├── Settings → tab "تفضيلات الإشعارات"
│   ├── جدول بكل أنواع الإشعارات
│   ├── كل نوع: toggle لـ (التطبيق | الإيميل | Push)
│   └── حفظ التفضيلات
```

### التأثير: التواصل والمتابعة  
### الصعوبة: متوسط

---

## 5. Time Tracking — تسجيل وقت العمل

### المشكلة
مفيش طريقة تعرف كام ساعة اشتغل الموظف على مشروع معين — مهم لحساب الربحية الفعلية.

### الحل

**جداول جديدة:**
```
time_entries
├── id
├── company_id
├── user_id (الموظف)
├── project_id (nullable)
├── task_id (nullable)
├── client_id (nullable)
├── description (وصف الشغل)
├── start_time (datetime)
├── end_time (datetime, nullable — لو لسه شغال)
├── duration_minutes (محسوب)
├── billable (boolean — يتحاسب عليه ولا لأ)
├── hourly_rate (nullable — سعر الساعة)
├── approved (boolean)
├── approved_by (FK → users)
├── created_at / updated_at
```

**Backend:**
```
├── TimeEntryController
│   ├── GET    /api/time-entries — القائمة (فلترة بالمشروع/الموظف/التاريخ)
│   ├── POST   /api/time-entries/start — بدء تتبع الوقت (timer)
│   ├── POST   /api/time-entries/stop — إيقاف التتبع
│   ├── POST   /api/time-entries — إدخال يدوي
│   ├── PUT    /api/time-entries/{id}
│   ├── DELETE /api/time-entries/{id}
│   ├── POST   /api/time-entries/{id}/approve
│   └── GET    /api/time-entries/report — تقرير (ساعات لكل مشروع/موظف/عميل)
```

**Frontend:**
```
├── Timer widget في الـ Header (start/stop بسيط)
│   ├── اختار مشروع + مهمة (optional)
│   ├── عداد مباشر
│   └── زرار إيقاف → يحفظ تلقائياً
├── pages/TimeTracking.tsx
│   ├── Timesheet أسبوعي (جدول: الأيام × المشاريع)
│   ├── إدخال يدوي
│   ├── فلترة حسب المشروع/الموظف
│   └── تقرير ملخص
├── إضافة في ProjectDetail.tsx
│   └── tab "ساعات العمل" — كام ساعة اتشغل على المشروع ده
├── إضافة في Reports.tsx
│   └── tab "تقرير الساعات" — ربحية كل مشروع (إيراد vs تكلفة ساعات)
```

### التأثير: ربحية المشاريع + إنتاجية الفريق  
### الصعوبة: متوسط

---

## 6. Templates فواتير وعقود

### المشكلة
الفواتير والعروض شكلها واحد ثابت — مفيش تخصيص أو برندنج.

### الحل

**Backend:**
```
├── جدول document_templates:
│   ├── id, company_id
│   ├── type (invoice | quotation | contract)
│   ├── name (اسم القالب)
│   ├── template_code (classic | modern | minimal)
│   ├── logo_path
│   ├── primary_color, secondary_color
│   ├── header_text, footer_text
│   ├── show_logo (boolean)
│   ├── show_company_address (boolean)
│   ├── show_bank_details (boolean)
│   ├── is_default (boolean)
│   └── created_at / updated_at
│
├── PDF Generation (DomPDF — موجود أصلاً):
│   ├── views/pdf/invoice-classic.blade.php
│   ├── views/pdf/invoice-modern.blade.php
│   ├── views/pdf/invoice-minimal.blade.php
│   ├── views/pdf/quotation-classic.blade.php
│   └── views/pdf/contract-classic.blade.php
```

**Frontend:**
```
├── Settings → tab "قوالب المستندات"
│   ├── اختيار القالب الافتراضي (classic/modern/minimal)
│   ├── رفع لوجو الشركة
│   ├── اختيار الألوان
│   ├── كتابة header/footer
│   ├── Preview مباشر للقالب
│   └── حفظ
├── عند تحميل PDF فاتورة/عرض → يستخدم القالب المختار
```

### التأثير: احترافية عالية  
### الصعوبة: متوسط

---

## 7. بوابة العميل (Client Portal)

### المشكلة
العميل لازم يتواصل معاكم عشان يعرف حالة مشروعه أو يشوف فاتورته.

### الحل

**Frontend جديد (أو route group منفصل):**
```
صفحة Login للعميل → /client-portal/login
    (كود دخول يتبعتله بالإيميل أو SMS)

بعد الدخول:
├── Dashboard — ملخص حسابه
│   ├── مشاريعه النشطة + نسبة الإنجاز
│   ├── فواتير مفتوحة
│   └── آخر التحديثات
├── المشاريع — تفاصيل كل مشروع
│   ├── المراحل والتقدم
│   ├── الملفات المشاركة
│   └── التعليقات / الملاحظات
├── الفواتير
│   ├── قائمة الفواتير (مدفوعة/مفتوحة/متأخرة)
│   ├── تحميل PDF
│   └── دفع أونلاين (مرحلة لاحقة)
├── الملفات — ملفات مشاركة بينكم
│   ├── عرض
│   ├── تحميل
│   └── رفع ملفات من العميل
├── الموافقات — (مرتبط بنظام السوشيال)
│   ├── بوستات تحتاج موافقة
│   └── عروض أسعار تحتاج موافقة
```

**Backend:**
```
├── ClientAuthController — login بكود OTP
├── ClientPortalController
│   ├── GET /api/client-portal/dashboard
│   ├── GET /api/client-portal/projects
│   ├── GET /api/client-portal/invoices
│   ├── GET /api/client-portal/files
│   └── POST /api/client-portal/files/upload
├── Middleware: ClientAuth (توكن مستقل عن auth الموظفين)
```

### التأثير: تقليل الشغل اليدوي + احترافية  
### الصعوبة: صعب (أسبوع+)

---

## 8. Backup & Restore من الواجهة

### المشكلة
الـ backup موجود كـ command بس المدير مش يقدر يعمل backup أو يحمّله من الـ Settings.

### الحل

**Backend:**
```
├── BackupController
│   ├── GET  /api/backups — قائمة النسخ المتاحة
│   ├── POST /api/backups — إنشاء نسخة جديدة (يشغّل backup:run)
│   ├── GET  /api/backups/{filename}/download — تحميل نسخة
│   └── DELETE /api/backups/{filename} — حذف نسخة قديمة
├── حماية: فقط super_admin و manager
```

**Frontend:**
```
├── Settings → tab "النسخ الاحتياطي"
│   ├── زرار "إنشاء نسخة احتياطية الآن"
│   ├── جدول النسخ: الاسم | الحجم | التاريخ | تحميل | حذف
│   ├── آخر نسخة تلقائية
│   └── إعدادات: التكرار (يومي/أسبوعي) + الاحتفاظ (آخر 7/14/30 نسخة)
```

### التأثير: راحة بال  
### الصعوبة: سهل

---

## 9. Multi-Currency حقيقي

### المشكلة
العقود فيها حقل currency بس مفيش سعر صرف ولا تحويل تلقائي في التقارير.

### الحل

**Backend:**
```
├── جدول exchange_rates:
│   ├── id, company_id
│   ├── from_currency (USD, SAR, EUR)
│   ├── to_currency (EGP)
│   ├── rate (decimal)
│   ├── source (manual | api)
│   ├── effective_date
│   └── created_at
├── CurrencyService
│   ├── convert(amount, from, to, date) — تحويل بسعر الصرف
│   ├── getRate(from, to, date) — جلب السعر
│   └── updateRatesFromAPI() — تحديث من API خارجي (اختياري)
├── تعديل التقارير:
│   ├── كل مبلغ يتعرض بالعملة الأصلية + المكافئ بالجنيه
│   └── إجماليات التقارير بالجنيه المصري (العملة الأساسية)
```

**Frontend:**
```
├── Settings → "العملات وسعر الصرف"
│   ├── العملة الأساسية: EGP
│   ├── أسعار الصرف الحالية (تعديل يدوي أو تحديث تلقائي)
│   └── سجل الأسعار
├── في الفواتير والتقارير:
│   └── عرض: "$500 (≈ 24,500 ج.م)" 
```

### التأثير: دقة مالية للعملاء الأجانب  
### الصعوبة: متوسط

---

## 10. أهداف و KPIs

### المشكلة
مفيش طريقة تعرّف target وتتابع الأداء مقابله.

### الحل

**جداول جديدة:**
```
goals
├── id, company_id
├── title (مثال: "10 عملاء جدد")
├── type (revenue | clients | leads | tasks | custom)
├── target_value (10)
├── current_value (7) — يتحسب تلقائياً أو يدوياً
├── unit (عميل | جنيه | مهمة | ليد)
├── period (monthly | quarterly | yearly)
├── start_date, end_date
├── assigned_to (FK → users, nullable — لو لموظف معين)
├── department (sales | marketing | all)
├── status (active | completed | failed)
├── created_at / updated_at

kpi_snapshots (سجل يومي للأرقام)
├── id, company_id
├── goal_id
├── value (القيمة في اللحظة دي)
├── snapshot_date
├── created_at
```

**Backend:**
```
├── GoalController — CRUD + حساب التقدم تلقائياً
├── Command: goals:update-progress → يتشغل يومياً
│   ├── يحسب: كام ليد جديد الشهر ده؟ → يحدّث current_value
│   ├── يحسب: كام إيراد؟ → يحدّث
│   └── يحفظ snapshot يومي
```

**Frontend:**
```
├── pages/Goals.tsx
│   ├── قائمة الأهداف مع Progress bars
│   ├── إنشاء هدف جديد
│   ├── Chart: التقدم عبر الزمن
│   └── مقارنة الأداء بين الموظفين
├── إضافة في Dashboard
│   └── كارد "الأهداف" — أهم 3 أهداف مع نسبة الإنجاز
```

### التأثير: أداء الفريق + تحفيز  
### الصعوبة: متوسط

---

## ملخص الأولويات

| # | الفيتشر | التأثير | الصعوبة | الأولوية |
|---|---------|---------|---------|----------|
| 1 | Rate Limiting | أمان حرج | سهل جداً | 🔴 فوراً |
| 2 | Audit Trail | محاسبة + ثقة | متوسط | 🔴 عالية |
| 3 | Dashboard لكل Role | تجربة مستخدم | متوسط | 🟡 متوسطة |
| 4 | Email Notifications | تواصل + متابعة | متوسط | 🟡 متوسطة |
| 5 | Time Tracking | ربحية المشاريع | متوسط | 🟡 متوسطة |
| 6 | Templates فواتير | احترافية | متوسط | 🟡 متوسطة |
| 7 | بوابة العميل | تقليل شغل يدوي | صعب | 🟡 متوسطة |
| 8 | Backup من الواجهة | راحة بال | سهل | 🟢 منخفضة |
| 9 | Multi-Currency | دقة مالية | متوسط | 🟢 منخفضة |
| 10 | أهداف و KPIs | أداء + تحفيز | متوسط | 🟢 منخفضة |
