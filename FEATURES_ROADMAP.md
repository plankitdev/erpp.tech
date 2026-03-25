# 🗺️ ERPFlex — خريطة المميزات والتطوير

> هذا الملف يحتوي على خطة تفصيلية لتطوير النظام — مميزات UI ومميزات النظام الأساسية.
> **الحالة**: تخطيط فقط — لم يتم التنفيذ بعد.

---

## 📋 جدول المحتويات

1. [مركز الإشعارات المتقدم](#1-مركز-الإشعارات-المتقدم)
2. [الوضع الليلي Dark Mode](#2-الوضع-الليلي-dark-mode)
3. [توحيد Loading Skeletons](#3-توحيد-loading-skeletons)
4. [مميزات النظام المقترحة](#4-مميزات-النظام-المقترحة)

---

## 1. مركز الإشعارات المتقدم

### الوضع الحالي ✅
النظام يحتوي بالفعل على بنية إشعارات قوية:
- **Backend**: موديل `Notification` بـ 13 نوع (task_assigned, invoice_overdue, meeting_reminder, إلخ)
- **API**: endpoints لجلب الإشعارات + عدد الغير مقروء + تحديد كمقروء
- **Frontend**: صفحة `/notifications` كاملة + `NotificationBell` في الهيدر مع dropdown
- **Polling**: كل 15 ثانية بيتشيك على إشعارات جديدة عبر `useNotifications` hook
- **Push**: موديل `PushSubscription` + endpoints للاشتراك (Web Push API جاهز)
- **Toast**: بيظهر toast لما يكون فيه إشعار جديد

### المطلوب تطويره 🚀

#### أ) إشعارات فورية (Real-time)
**المشكلة**: الإشعارات بتيجي بالـ polling كل 15 ثانية — ممكن يكون فيه تأخير.

**الحلول المتاحة (مرتبة من الأسهل للأقوى)**:

| الحل | التعقيد | التكلفة | السرعة |
|------|---------|---------|--------|
| تقليل polling لـ 5 ثوانٍ | سهل جداً | مجاني | 5 ثوانٍ |
| Server-Sent Events (SSE) | متوسط | مجاني | فوري |
| Laravel Reverb (WebSocket) | متقدم | مجاني (self-hosted) | فوري |
| Pusher/Ably | متقدم | مدفوع | فوري |

**الحل المقترح**: **SSE (Server-Sent Events)** — أبسط من WebSocket، لا يحتاج مكتبات، يعمل مع PHP.

**خطوات التنفيذ**:
```
Backend:
├── إنشاء NotificationStreamController
│   └── GET /api/notifications/stream (SSE endpoint)
│   └── يبعث event لكل إشعار جديد
├── تعديل NotificationService
│   └── بعد إنشاء أي إشعار → يتم إرسال event
│
Frontend:
├── إنشاء useNotificationStream hook
│   └── EventSource connection لـ /api/notifications/stream
│   └── عند استلام event → invalidate query + عرض toast
├── تعديل Layout.tsx
│   └── تشغيل الـ hook في الـ Layout
│   └── إلغاء الـ polling القديم (أو تقليله لـ fallback)
```

#### ب) إشعارات Push حقيقية
**الوضع الحالي**: البنية جاهزة (PushSubscription model + endpoints) لكن مفيش إرسال فعلي.

**خطوات التفعيل**:
```
Backend:
├── تثبيت web-push PHP library (minishlink/web-push)
├── إنشاء PushNotificationService
│   └── يبعث Push notification عبر Web Push API
├── تعديل NotificationService
│   └── بعد إنشاء إشعار → يرسل push للمشتركين
│
Frontend:
├── تفعيل Service Worker (sw.js)
│   └── استقبال push events
│   └── عرض notification نظام التشغيل
├── طلب إذن Push من المستخدم (في الـ Settings أو عند أول login)
├── إرسال subscription للـ backend عند القبول
```

#### ج) تحسينات UI للإشعارات
```
├── تصنيف الإشعارات بـ tabs (الكل | مهام | مالية | اجتماعات | نظام)
├── إضافة أيقونات ملونة بدل الـ emoji الحالية
├── Swipe to dismiss على الموبايل
├── إشعارات مجمعة (3 مهام جديدة بدل 3 إشعارات منفصلة)
├── Sound notification (صوت قصير عند إشعار جديد) — اختياري في Settings
├── Notification Preferences في Settings:
│   └── اختيار أنواع الإشعارات المراد استقبالها
│   └── اختيار طريقة الإشعار (في النظام / Push / بدون)
│   └── جدولة "لا تزعجني" (مثلاً من 10 مساءً لـ 8 صباحاً)
```

#### الأولوية المقترحة
1. **أولاً**: تحسين UI + تصنيف الإشعارات (سهل، تأثير كبير)
2. **ثانياً**: SSE للإشعارات الفورية
3. **ثالثاً**: تفعيل Web Push
4. **رابعاً**: Notification Preferences

---

## 2. الوضع الليلي (Dark Mode)

### الوضع الحالي
- لا يوجد أي دعم للـ Dark Mode
- Tailwind config لا يحتوي على `darkMode` setting
- لا يوجد أي `dark:` classes في المشروع
- الـ Sidebar لونه غامق بالفعل (لن يتأثر كثيراً)

### خطة التنفيذ

#### أ) إعداد Tailwind
```
tailwind.config.js:
├── إضافة darkMode: 'class'
│   (يعني dark mode يتفعل بإضافة class="dark" على <html>)
```

#### ب) Theme Store
```
Frontend:
├── إنشاء useThemeStore (Zustand)
│   ├── theme: 'light' | 'dark' | 'system'
│   ├── setTheme(theme)
│   ├── حفظ/قراءة من localStorage
│   └── sync مع system preference (matchMedia)
├── تعديل main.tsx
│   └── قراءة الـ theme وتطبيق class="dark" على <html>
│   └── listener لتغييرات system theme
```

#### ج) ألوان الـ Dark Mode — Design Tokens

| العنصر | Light | Dark |
|--------|-------|------|
| خلفية الصفحة | `#f8fafc` (slate-50) | `#0f172a` (slate-900) |
| خلفية الكروت | `white` | `#1e293b` (slate-800) |
| خلفية الجداول | `white` | `#1e293b` |
| header الجدول | `#f8fafc` | `#334155` (slate-700) |
| النص الأساسي | `gray-900` | `gray-100` |
| النص الثانوي | `gray-500` | `gray-400` |
| الحدود | `gray-200` | `slate-700` |
| الـ hover | `gray-50` | `slate-700` |
| الـ input bg | `white` | `slate-800` |
| الـ input border | `gray-200` | `slate-600` |
| الـ modal bg | `white` | `slate-800` |
| الـ modal overlay | `black/40` | `black/60` |

#### د) الملفات المطلوب تعديلها

```
المرحلة 1 — الأساسيات (الأهم):
├── tailwind.config.js          → darkMode: 'class'
├── src/store/themeStore.ts     → (جديد) Theme state management
├── src/main.tsx                → تطبيق الـ theme
├── src/index.css               → إضافة dark: variants لكل component class
│   ├── body                    → dark:bg-slate-900 dark:text-gray-100
│   ├── .card                   → dark:bg-slate-800 dark:border-slate-700
│   ├── .input/.select          → dark:bg-slate-800 dark:border-slate-600
│   ├── .data-table             → dark:bg-slate-800 headers + rows
│   ├── .modal-content          → dark:bg-slate-800
│   ├── .stat-card              → dark:bg-slate-800
│   ├── .badge-*                → dark variants لكل badge
│   └── .page-title             → dark:text-gray-100
├── src/components/Layout.tsx   → Theme toggle button في header
│
المرحلة 2 — الصفحات:
├── كل صفحة فيها ألوان inline (bg-white, text-gray-900, border-gray-100)
│   محتاج إضافة dark: equivalent
│   الأولوية: Dashboard → Tasks → Projects → Clients → باقي الصفحات
│
المرحلة 3 — التفاصيل:
├── Charts (Recharts) → تغيير ألوان المحاور والـ tooltip
├── Toast (react-hot-toast) → dark theme
├── Scrollbar colors → dark variant
├── Status badges → تأكد إنها قابلة للقراءة على dark
```

#### هـ) Toggle UI
```
مكان الـ toggle: في الـ header بجانب الـ notification bell
الشكل: أيقونة ☀️/🌙 — بضغطة واحدة يتبدل
الخيارات (في Settings): Light / Dark / System (يتبع نظام التشغيل)
```

#### الأولوية المقترحة
1. **أولاً**: إعداد البنية (Tailwind + Store + main.tsx) — 30 دقيقة
2. **ثانياً**: index.css design system classes — ساعة
3. **ثالثاً**: Layout + Header toggle — 30 دقيقة
4. **رابعاً**: الصفحات الرئيسية (Dashboard, Tasks, Projects) — ساعتين
5. **خامساً**: باقي الصفحات + Charts + التفاصيل — 3 ساعات

---

## 3. توحيد Loading Skeletons

### الوضع الحالي
الـ Skeleton Components الموجودة في `Skeletons.tsx`:
- `SkeletonText` — سطر نص
- `SkeletonCircle` — دائرة (avatar)
- `SkeletonCard` — كارت كامل
- `SkeletonStat` — stat card
- `SkeletonTable` — جدول (rows × cols)
- `SkeletonForm` — فورم (4 حقول + أزرار)
- `SkeletonPage` — صفحة كاملة (header + stats + table)

**المشكلة**: كل الـ components دي موجودة بس مش كل الصفحات بتستخدمها:

| الصفحة | الـ Loading الحالي | المفروض |
|--------|-------------------|---------|
| Clients | ✅ `SkeletonTable` | ✅ |
| Employees | ✅ `SkeletonTable` | ✅ |
| Projects (grid) | ✅ `SkeletonCard` | ✅ |
| Tasks | ❌ `animate-pulse` يدوي | `SkeletonCard` متكرر |
| TaskBoard | ❌ Spinner بسيط | Skeleton لكل عمود Kanban |
| Dashboard | ❌ لا يوجد loading | `SkeletonStat` + `SkeletonCard` |
| Meetings | ❌ `SkeletonTable` (مع إن الشكل كروت) | Skeleton cards |
| Tickets | ❌ نص "جاري التحميل..." | `SkeletonTable` |
| Invoices | ❌ بدون | `SkeletonTable` |
| Quotations | ❌ بدون | `SkeletonTable` |
| Reports | ❌ بدون | `SkeletonPage` |
| Announcements | ✅ Custom skeleton | ✅ |
| Activity Logs | ✅ Custom skeleton | ✅ |

### خطة التوحيد

#### أ) Skeletons جديدة مطلوبة
```
Skeletons.tsx (إضافة):
├── SkeletonKanban         → 4 أعمدة، كل عمود فيه 3-4 كروت skeleton
├── SkeletonMeetingCard    → كارت اجتماع (عنوان + وقت + مشاركين)
├── SkeletonDashboard      → WelcomeBanner skeleton + stat cards + charts
├── SkeletonTaskItem       → سطر مهمة (أيقونة + عنوان + badge + تاريخ)
├── SkeletonChart          → مستطيل بحجم الـ chart مع shimmer
```

#### ب) خطة التطبيق على كل صفحة
```
الملفات المطلوب تعديلها:
├── Tasks.tsx         → استبدال animate-pulse يدوي بـ SkeletonTaskItem × 5
├── TaskBoard.tsx     → استبدال spinner بـ SkeletonKanban
├── Dashboard.tsx     → إضافة SkeletonDashboard كـ loading state
├── Meetings.tsx      → استبدال SkeletonTable بـ SkeletonMeetingCard × 4
├── Tickets.tsx       → إضافة SkeletonTable
├── Invoices.tsx      → إضافة SkeletonTable
├── Quotations.tsx    → إضافة SkeletonTable
├── Reports.tsx       → إضافة SkeletonPage
├── Treasury.tsx      → إضافة SkeletonTable
├── Expenses.tsx      → إضافة SkeletonTable
├── Leads.tsx         → إضافة SkeletonTable أو SkeletonCard
```

#### ج) تحسين الـ shimmer animation
```css
/* الحالي — جيد لكن ممكن نضيف responsive */
.skeleton-shimmer {
  background: linear-gradient(110deg, #f0f0f0 8%, #e8e8e8 18%, #f0f0f0 33%);
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}

/* مقترح — dark mode support */
.dark .skeleton-shimmer {
  background: linear-gradient(110deg, #1e293b 8%, #334155 18%, #1e293b 33%);
}
```

---

## 4. مميزات النظام المقترحة

### 🔴 أولوية عالية (تأثير مباشر على العمل اليومي)

#### 4.1 بوابة العميل (Client Portal)
**الفكرة**: رابط خارجي يقدر العميل يدخل عليه ويشوف حاجاته.

**اللي هيشوفه العميل**:
- فواتيره وحالة الدفع
- تقدم المشاريع الخاصة بيه (progress bar + مهام مكتملة)
- تذاكر الدعم بتاعته + يبعت تذكرة جديدة
- العقود والأقساط
- الملفات المشتركة (تصاميم، تقارير)

**التقنية**:
```
Backend:
├── Client authentication (token-based, separate from staff)
├── ClientPortalController
│   ├── GET /portal/dashboard — ملخص عام
│   ├── GET /portal/invoices — فواتير العميل
│   ├── GET /portal/projects — مشاريعه
│   ├── GET /portal/tickets — تذاكره
│   └── POST /portal/tickets — إنشاء تذكرة
├── Middleware: auth:client-portal
│
Frontend (صفحات منفصلة أو subdomain):
├── /portal/login
├── /portal/dashboard
├── /portal/invoices
├── /portal/projects/:id
├── /portal/tickets
```

**القيمة**: يقلل الضغط على فريق الدعم + يدي العميل شفافية + احترافية.

---

#### 4.2 تكامل WhatsApp
**الفكرة**: إرسال إشعارات وفواتير عبر WhatsApp API.

**الاستخدامات**:
- إرسال فاتورة PDF للعميل عبر WhatsApp
- تذكير بموعد دفع قسط
- إشعار العميل بتحديث في مشروعه
- إرسال رابط بوابة العميل

**التقنية**:
```
├── تكامل مع WhatsApp Business API (أو مزود مثل Twilio/360dialog)
├── WhatsApp Message Templates (معتمدة من Meta)
├── إضافة زرار "إرسال عبر WhatsApp" بجانب كل فاتورة/عقد
├── إعدادات WhatsApp في Settings (API key, phone number)
```

---

#### 4.3 الفواتير المتكررة (Recurring Invoices)
**الفكرة**: فاتورة بتتعمل أوتوماتيك كل شهر/أسبوع/سنة.

**مثال**: عميل عنده اشتراك شهري 5000 ج → النظام يعمل فاتورة أول كل شهر تلقائياً.

**التقنية**:
```
Backend:
├── إضافة حقول للـ Invoice model:
│   ├── is_recurring: boolean
│   ├── frequency: daily/weekly/monthly/yearly
│   ├── next_invoice_date: date
│   ├── recurring_end_date: date | null
│   └── parent_invoice_id: FK (للربط بالفاتورة الأم)
├── Laravel Scheduler (cron job):
│   └── كل يوم يتشيك: أي فاتورة متكررة وصل ميعادها؟ → ينشئ نسخة جديدة
├── إشعار عند إنشاء فاتورة متكررة
│
Frontend:
├── Toggle "فاتورة متكررة" في فورم الفاتورة
├── اختيار التكرار (يومي/أسبوعي/شهري/سنوي)
├── تاريخ نهاية التكرار (اختياري)
├── قائمة "الفواتير المتكررة" في صفحة الفواتير
```

---

#### 4.4 المصروفات المتكررة (Recurring Expenses)
**نفس فكرة الفواتير المتكررة** بس للمصروفات.

**أمثلة**: إيجار المكتب، اشتراك الإنترنت، رواتب freelancers.

```
├── is_recurring + frequency + next_date على Expense model
├── Scheduler يعمل مصروف جديد تلقائي
├── Dashboard يعرض "مصروفات متكررة هذا الشهر"
```

---

#### 4.5 نظام الموافقات (Approval Workflows)
**الفكرة**: بعض العمليات محتاجة موافقة مدير قبل التنفيذ.

**العمليات اللي ممكن تحتاج موافقة**:
- مصروف أكبر من مبلغ معين
- طلب إجازة
- عرض سعر أكبر من مبلغ معين
- خصم أو تعديل فاتورة

**التقنية**:
```
Backend:
├── ApprovalRequest model
│   ├── type: expense/leave/quotation/invoice_discount
│   ├── requestable_type + requestable_id (polymorphic)
│   ├── requested_by: FK User
│   ├── status: pending/approved/rejected
│   ├── decided_by: FK User
│   ├── decided_at: datetime
│   └── notes: text
├── ApprovalPolicy — قواعد متى نطلب موافقة
│   ├── model_type: Expense
│   ├── condition: amount > 5000
│   └── approver_role: manager
├── إشعار للمدير لما يكون فيه طلب موافقة
├── إشعار للموظف لما يتم قبول/رفض الطلب
│
Frontend:
├── صفحة "الموافقات" في sidebar
├── Badge بعدد الطلبات المعلقة
├── أزرار قبول/رفض مع ملاحظات
├── تاريخ الموافقات السابقة
```

---

### 🟡 أولوية متوسطة (تحسن الكفاءة)

#### 4.6 لوحة أداء الموظف (Employee KPI Dashboard)
**الفكرة**: صفحة لكل موظف تعرض مؤشرات أدائه.

**المؤشرات**:
- معدل إنجاز المهام (مكتملة / إجمالي)
- متوسط وقت إنجاز المهمة
- نسبة الحضور والالتزام بالمواعيد
- عدد أيام الإجازات (مستخدمة / متبقية)
- ساعات العمل المسجلة (Time Tracking)
- رضا العملاء (لو بوابة العميل موجودة)
- تقييم شهري من المدير (اختياري)

**القيمة**: بيساعد في تقييم الأداء بشكل موضوعي + تحفيز الموظفين.

---

#### 4.7 تقارير مجدولة (Scheduled Reports)
**الفكرة**: إرسال تقارير PDF بالإيميل أوتوماتيك.

**أمثلة**:
- تقرير مالي أسبوعي كل يوم أحد للمدير
- ملخص المهام المتأخرة يومياً للمدير
- تقرير حضور شهري لـ HR
- تقرير مبيعات شهري لفريق Sales

```
├── ScheduledReport model (report_type, frequency, recipients, filters)
├── Laravel Scheduler يشغل التقرير في الموعد
├── يعمل PDF ويبعته بالإيميل
├── صفحة إدارة التقارير المجدولة في Settings
```

---

#### 4.8 أهداف وتارجتات (Goals & Targets)
**الفكرة**: تحديد أهداف مبيعات أو مشاريع وتتبع التقدم.

**أمثلة**:
- تارجت مبيعات: 100,000 ج هذا الشهر (حققنا 72,000 ✅ 72%)
- تارجت leads: 50 lead جديد هذا الشهر
- تارجت مشاريع: تسليم 5 مشاريع هذا الربع

```
├── Goal model (title, target_value, current_value, type, deadline, assigned_to)
├── يتحدث أوتوماتيك من بيانات النظام (فواتير، leads، مشاريع)
├── Widget في الداشبورد يعرض التقدم نحو الأهداف
├── إشعار عند تحقيق الهدف 🎉
```

---

#### 4.9 توقيع رقمي للعقود والعروض (Digital Signatures)
**الفكرة**: العميل يقدر يوقع العقد أو عرض السعر إلكترونياً.

```
├── إنشاء رابط توقيع خاص لكل عقد/عرض سعر
├── العميل يفتح الرابط → يشوف الوثيقة → يوقع (رسم/نص)
├── التوقيع يتحفظ + timestamp + IP
├── الوثيقة تتأشر كـ "موقعة" في النظام
├── إشعار للموظف لما العميل يوقع
```

---

#### 4.10 تكامل Google Calendar
**الفكرة**: مزامنة الاجتماعات مع Google Calendar.

```
├── OAuth2 login with Google
├── Sync meetings → Google Calendar events
├── Two-way sync: تعديل في Google ينعكس في النظام والعكس
├── إعداد في Settings لكل مستخدم
```

---

### 🟢 أولوية منخفضة (nice-to-have)

#### 4.11 استبيان رضا العميل
- بعد إغلاق تذكرة أو تسليم مشروع
- رابط قصير يفتح استبيان بسيط (1-5 نجوم + تعليق)
- النتائج تظهر في بروفايل العميل وتقارير الأداء

#### 4.12 مكتبة قوالب (Templates Library)
- قوالب جاهزة للإيميلات (ترحيب، متابعة، تأخير دفع)
- قوالب عقود حسب نوع الخدمة
- قوالب مشاريع (موجودة بالفعل — ممكن تتطور أكتر)

#### 4.13 لوحة تحكم قابلة للتخصيص
- سحب وإفلات widgets الداشبورد
- كل مستخدم يرتب الداشبورد حسب احتياجه
- إضافة/إزالة أقسام (charts, lists, stats)

#### 4.14 تطبيق موبايل (Mobile App)
- React Native أو Flutter
- نفس الـ API الحالي
- إشعارات Push أصلية
- Check-in/out بالـ GPS

#### 4.15 AI Assistant
- تحليل البيانات وتقديم insights
- توقع الإيرادات والمصروفات
- اقتراح أولويات المهام
- تلخيص اجتماعات (من الـ notes)

---

## 📊 ملخص الأولويات

| # | الميزة | الأولوية | الجهد | التأثير |
|---|--------|---------|-------|---------|
| 1 | مركز الإشعارات المتقدم | 🔴 عالية | متوسط | كبير |
| 2 | Dark Mode | 🔴 عالية | متوسط | كبير (UX) |
| 3 | توحيد Skeletons | 🟡 متوسطة | منخفض | متوسط (UX) |
| 4.1 | بوابة العميل | 🔴 عالية | كبير | كبير جداً |
| 4.2 | تكامل WhatsApp | 🔴 عالية | متوسط | كبير |
| 4.3 | فواتير متكررة | 🔴 عالية | متوسط | كبير |
| 4.4 | مصروفات متكررة | 🟡 متوسطة | منخفض | متوسط |
| 4.5 | نظام موافقات | 🟡 متوسطة | كبير | كبير |
| 4.6 | KPI Dashboard | 🟡 متوسطة | متوسط | متوسط |
| 4.7 | تقارير مجدولة | 🟡 متوسطة | متوسط | متوسط |
| 4.8 | أهداف وتارجتات | 🟡 متوسطة | متوسط | متوسط |
| 4.9 | توقيع رقمي | 🟢 منخفضة | متوسط | متوسط |
| 4.10 | Google Calendar | 🟢 منخفضة | متوسط | منخفض |
| 4.11 | استبيان رضا | 🟢 منخفضة | منخفض | منخفض |
| 4.12 | مكتبة قوالب | 🟢 منخفضة | منخفض | منخفض |
| 4.13 | داشبورد قابل للتخصيص | 🟢 منخفضة | كبير | متوسط |
| 4.14 | تطبيق موبايل | 🟢 منخفضة | كبير جداً | كبير |
| 4.15 | AI Assistant | 🟢 منخفضة | كبير جداً | كبير |

---

## 📝 ملاحظات
- الترتيب المقترح للتنفيذ: Skeletons → Dark Mode → Notifications → Client Portal → Recurring Invoices → WhatsApp
- كل ميزة مستقلة ويمكن تنفيذها بدون الأخرى
- البنية التحتية الحالية (Models, API, Hooks) قوية وتدعم معظم هذه المميزات

> آخر تحديث: مارس 2026
