# ERPFlex — تقرير المشروع الشامل

> **نظام ERP متعدد الشركات (Multi-Tenant) لإدارة الأعمال**
>
> تاريخ التقرير: 16 مارس 2026

---

## 📋 نظرة عامة

ERPFlex هو نظام تخطيط موارد المؤسسات (ERP) مبني كتطبيق ويب حديث يدعم إدارة شركات متعددة من لوحة تحكم واحدة. النظام مصمم بالكامل باللغة العربية (RTL) ويشمل إدارة العملاء، العقود، الفواتير، الموظفين، الرواتب، الخزينة، المصروفات، المهام، الشركاء، التقارير، والإشعارات.

---

## 🏗️ البنية التقنية

### Backend
| التقنية | الإصدار |
|---------|---------|
| PHP | 8.2+ |
| Laravel Framework | 12.x |
| Laravel Sanctum | 4.3 (Token-based Auth) |
| قاعدة البيانات | MySQL |

### Frontend
| التقنية | الإصدار |
|---------|---------|
| React | 18.3 |
| TypeScript | 5.9.3 |
| Vite | 5.4.21 |
| Tailwind CSS | 3.4.19 |
| React Query | 5.90.21 |
| Zustand | 5.0.11 |
| Recharts | 3.8.0 |
| Axios | 1.13.6 |
| React Router DOM | 6.30.3 |
| React Hot Toast | (Notifications) |
| Lucide React | (Icons) |

---

## 📊 إحصائيات المشروع

| الفئة | العدد |
|-------|-------|
| Models (Backend) | 19 |
| Controllers (Backend) | 18 |
| Migrations (Backend) | 25 |
| API Resources (Backend) | 14 |
| Traits (Backend) | 4 |
| API Routes | 88 |
| Pages (Frontend) | 28 |
| Components (Frontend) | 6 |
| Custom Hooks (Frontend) | 13 |
| API Modules (Frontend) | 16 |
| Store (Frontend) | 1 (Zustand) |

---

## 🔐 نظام المصادقة والصلاحيات

### المصادقة
- **Laravel Sanctum** — Token-based authentication (بدون CSRF/sessions)
- تسجيل دخول عبر البريد الإلكتروني وكلمة المرور
- إجبار تغيير كلمة المرور عند أول تسجيل دخول (`force_password_change`)
- إعادة تعيين كلمة المرور بواسطة الأدمن (يولد كلمة مرور عشوائية `Pass@XXXX`)
- تم إزالة "نسيت كلمة المرور" — الإعادة فقط عبر الأدمن

### الأدوار والصلاحيات
| الدور | الوصف | الصلاحيات الرئيسية |
|-------|-------|-------------------|
| `super_admin` | مدير النظام | جميع الصلاحيات + إدارة الشركات والمستخدمين |
| `manager` | مدير الشركة | جميع العمليات داخل الشركة |
| `accountant` | محاسب | الفواتير، الرواتب، الخزينة، التقارير |
| `sales` | مبيعات | العملاء، العقود، الفواتير |
| `employee` | موظف | المهام الخاصة، الرواتب الخاصة |

### حساب السوبر أدمن
- **البريد:** `superadmin@erpp.tech`
- **كلمة المرور:** `Admin@2026`

---

## 🏢 نظام Multi-Tenant

- كل شركة منفصلة تمامًا عن غيرها في البيانات
- السوبر أدمن يمكنه التبديل بين الشركات من صفحة `/select-company`
- إنشاء شركات جديدة مع رفع الشعار واختيار اللون الأساسي
- كل مستخدم ينتمي لشركة واحدة (`company_id`)
- Trait `BelongsToCompany` يفلتر البيانات تلقائيًا حسب الشركة

---

## 📁 هيكل الملفات

### Backend (`backend/`)
```
app/
├── Http/
│   ├── Controllers/Api/
│   │   ├── ActivityLogController.php
│   │   ├── AuthController.php
│   │   ├── ClientController.php
│   │   ├── CompanyController.php
│   │   ├── ContractController.php
│   │   ├── DashboardController.php
│   │   ├── EmployeeController.php
│   │   ├── ExpenseController.php
│   │   ├── InstallmentController.php
│   │   ├── InvoiceController.php
│   │   ├── NotificationController.php
│   │   ├── PartnerController.php
│   │   ├── ReportController.php
│   │   ├── SalaryPaymentController.php
│   │   ├── TaskController.php
│   │   ├── TreasuryController.php
│   │   ├── UserController.php
│   │   └── SuperAdmin/
│   │       └── CompanyController.php
│   └── Resources/ (14 resource classes)
├── Models/ (19 models)
├── Traits/
│   ├── ApiResponse.php
│   ├── BelongsToCompany.php
│   ├── HasCompany.php
│   └── LogsActivity.php
database/migrations/ (25 migrations)
routes/api.php (88 routes)
```

### Frontend (`frontend/`)
```
src/
├── api/ (16 modules)
│   ├── axios.ts          — Axios instance + interceptors
│   ├── auth.ts           — Login/Logout/Me/ChangePassword + SuperAdmin APIs
│   ├── companies.ts      — CRUD + logo upload
│   ├── clients.ts
│   ├── contracts.ts
│   ├── invoices.ts
│   ├── employees.ts
│   ├── expenses.ts
│   ├── installments.ts
│   ├── tasks.ts
│   ├── treasury.ts
│   ├── partners.ts
│   ├── dashboard.ts
│   ├── users.ts
│   ├── notifications.ts
│   └── activityLogs.ts
├── components/
│   ├── Layout.tsx         — Sidebar + Header + Main content
│   ├── NotificationBell.tsx
│   ├── TaskDetailDrawer.tsx
│   ├── ErrorMessage.tsx
│   ├── EmptyState.tsx
│   └── LoadingSpinner.tsx
├── hooks/ (13 custom hooks)
│   ├── useClients.ts
│   ├── useContracts.ts
│   ├── useInvoices.ts
│   ├── useEmployees.ts
│   ├── useExpenses.ts
│   ├── useInstallments.ts
│   ├── useTasks.ts
│   ├── useTreasury.ts
│   ├── usePartners.ts
│   ├── useDashboard.ts
│   ├── useUsers.ts
│   ├── useNotifications.ts
│   └── useActivityLogs.ts
├── pages/ (28 pages)
│   ├── Login.tsx
│   ├── ChangePassword.tsx
│   ├── SelectCompany.tsx
│   ├── Dashboard.tsx
│   ├── Clients.tsx / ClientForm.tsx / ClientProfile.tsx
│   ├── Contracts.tsx / ContractForm.tsx
│   ├── Invoices.tsx / InvoiceForm.tsx / InvoiceDetail.tsx
│   ├── Employees.tsx / EmployeeForm.tsx / EmployeeProfile.tsx
│   ├── Salaries.tsx
│   ├── Treasury.tsx
│   ├── Expenses.tsx
│   ├── Tasks.tsx / TaskBoard.tsx
│   ├── Partners.tsx / PartnerStatement.tsx
│   ├── Reports.tsx
│   ├── Users.tsx
│   ├── Installments.tsx
│   ├── Notifications.tsx
│   ├── ActivityLogs.tsx
│   └── Settings.tsx
├── store/
│   └── authStore.ts      — Zustand state management
├── types/
│   └── index.ts          — TypeScript interfaces
├── utils/
│   └── index.ts          — formatCurrency, statusLabels, statusColors
├── App.tsx               — Routes + lazy loading
├── main.tsx
└── index.css             — Tailwind + custom animations
```

---

## 🔗 API Routes (88 route)

### المصادقة (4 routes)
| Method | URI | الوصف |
|--------|-----|-------|
| POST | `/api/auth/login` | تسجيل الدخول |
| POST | `/api/auth/logout` | تسجيل الخروج |
| GET | `/api/auth/me` | بيانات المستخدم الحالي |
| POST | `/api/auth/change-password` | تغيير كلمة المرور |

### إدارة الشركات — Super Admin (7 routes)
| Method | URI | الوصف |
|--------|-----|-------|
| GET | `/api/super-admin/companies` | قائمة الشركات النشطة |
| POST | `/api/super-admin/companies/{id}/switch` | التبديل للشركة |
| GET | `/api/companies` | جميع الشركات |
| POST | `/api/companies` | إنشاء شركة (مع رفع شعار) |
| GET | `/api/companies/{id}` | تفاصيل شركة |
| PUT | `/api/companies/{id}` | تعديل شركة (مع تحديث شعار) |
| DELETE | `/api/companies/{id}` | تعطيل شركة |

### العملاء (CRUD)
| Method | URI | الوصف |
|--------|-----|-------|
| GET/POST | `/api/clients` | قائمة/إنشاء |
| GET/PUT/DELETE | `/api/clients/{id}` | عرض/تعديل/حذف |

### العقود (CRUD + Installments)
| Method | URI | الوصف |
|--------|-----|-------|
| GET/POST | `/api/contracts` | قائمة/إنشاء |
| GET/PUT/DELETE | `/api/contracts/{id}` | عرض/تعديل/حذف |
| GET | `/api/contracts/{id}/installments` | أقساط العقد |
| POST | `/api/contracts/{id}/installments/generate` | توليد الأقساط |
| POST | `/api/installments/{id}/pay` | دفع قسط |

### الفواتير (CRUD + Payments + PDF)
| Method | URI | الوصف |
|--------|-----|-------|
| GET/POST | `/api/invoices` | قائمة/إنشاء |
| GET/PUT/DELETE | `/api/invoices/{id}` | عرض/تعديل/حذف |
| POST | `/api/invoices/{id}/payments` | تسجيل دفعة |
| GET | `/api/invoices/{id}/pdf` | تحميل PDF عربي |

### الموظفين والرواتب
| Method | URI | الوصف |
|--------|-----|-------|
| CRUD | `/api/employees` | إدارة الموظفين |
| CRUD | `/api/salary-payments` | إدارة الرواتب |

### الخزينة والمصروفات
| Method | URI | الوصف |
|--------|-----|-------|
| GET | `/api/treasury/balance` | رصيد الخزينة |
| CRUD | `/api/treasury` | معاملات الخزينة |
| CRUD | `/api/expenses` | المصروفات |

### المهام
| Method | URI | الوصف |
|--------|-----|-------|
| CRUD | `/api/tasks` | إدارة المهام |
| POST | `/api/tasks/{id}/comments` | إضافة تعليق |

### الشركاء
| Method | URI | الوصف |
|--------|-----|-------|
| CRUD | `/api/partners` | إدارة الشركاء |
| GET | `/api/partners/profits` | أرباح الشركاء |
| GET | `/api/partners/monthly-profit` | الربح الشهري |
| GET | `/api/partners/{id}/statement` | كشف حساب شريك |
| POST | `/api/partners/{id}/payments` | تسجيل دفعة شريك |

### المستخدمين
| Method | URI | الوصف |
|--------|-----|-------|
| CRUD | `/api/users` | إدارة المستخدمين |
| POST | `/api/users/{id}/reset-password` | إعادة تعيين كلمة المرور |

### التقارير (6 routes)
| Method | URI | الوصف |
|--------|-----|-------|
| GET | `/api/reports/monthly` | تقرير شهري |
| GET | `/api/reports/yearly` | تقرير سنوي |
| GET | `/api/reports/clients` | تقرير العملاء |
| GET | `/api/reports/salaries` | تقرير الرواتب |
| GET | `/api/reports/treasury` | تقرير الخزينة |
| GET | `/api/reports/partners` | تقرير الشركاء |

### الإشعارات (4 routes)
| GET | `/api/notifications` | الإشعارات |
| GET | `/api/notifications/unread-count` | عدد غير المقروءة |
| POST | `/api/notifications/{id}/read` | تعليم كمقروء |
| POST | `/api/notifications/read-all` | تعليم الكل مقروء |

### سجل النشاطات
| GET | `/api/activity-logs` | سجل جميع النشاطات |

### لوحة التحكم
| GET | `/api/dashboard` | بيانات الداشبورد |

---

## 🗃️ Models (19 model)

| Model | الجدول | العلاقات الرئيسية |
|-------|--------|------------------|
| User | users | belongsTo Company |
| Company | companies | hasMany Users, Clients, Contracts, etc. |
| Client | clients | hasMany Contracts, belongsTo Company |
| Contract | contracts | belongsTo Client, hasMany Invoices, Installments |
| Invoice | invoices | belongsTo Contract, hasMany InvoicePayments |
| InvoicePayment | invoice_payments | belongsTo Invoice |
| Installment | installments | belongsTo Contract |
| Employee | employees | belongsTo Company, belongsTo User |
| EmployeeFile | employee_files | belongsTo Employee |
| SalaryPayment | salary_payments | belongsTo Employee |
| TreasuryTransaction | treasury_transactions | belongsTo Company |
| Expense | expenses | belongsTo Company |
| Task | tasks | belongsTo Company, belongsTo User (assigned/created) |
| TaskComment | task_comments | belongsTo Task, belongsTo User |
| Partner | partners | hasMany PartnerPayments |
| PartnerPayment | partner_payments | belongsTo Partner |
| Notification | notifications | belongsTo User |
| ActivityLog | activity_logs | belongsTo User |
| Currency | currencies | — |

---

## 🖥️ الصفحات (28 page)

### صفحات المصادقة
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Login | `/login` | تسجيل دخول احترافي (split-screen design) |
| ChangePassword | `/change-password` | تغيير كلمة المرور الإجبارية |
| SelectCompany | `/select-company` | اختيار/إنشاء شركة (glassmorphism design) |

### لوحة التحكم
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Dashboard | `/` | إحصائيات + رسوم بيانية + آخر النشاطات |

### إدارة العملاء
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Clients | `/clients` | قائمة العملاء مع بحث وفلترة |
| ClientForm | `/clients/create` & `/clients/:id/edit` | إنشاء/تعديل عميل |
| ClientProfile | `/clients/:id` | ملف العميل الشامل |

### إدارة العقود
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Contracts | `/contracts` | قائمة العقود |
| ContractForm | `/contracts/create` & `/contracts/:id/edit` | إنشاء/تعديل عقد |
| Installments | `/contracts/:id/installments` | إدارة أقساط العقد |

### إدارة الفواتير
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Invoices | `/invoices` | قائمة الفواتير |
| InvoiceForm | `/invoices/create` & `/invoices/:id/edit` | إنشاء/تعديل فاتورة |
| InvoiceDetail | `/invoices/:id` | تفاصيل الفاتورة + دفعات + تحميل PDF عربي |

### إدارة الموظفين
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Employees | `/employees` | قائمة الموظفين |
| EmployeeForm | `/employees/create` & `/employees/:id/edit` | إنشاء/تعديل موظف |
| EmployeeProfile | `/employees/:id` | ملف الموظف |

### المالية
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Salaries | `/salaries` | إدارة الرواتب الشهرية |
| Treasury | `/treasury` | معاملات الخزينة |
| Expenses | `/expenses` | إدارة المصروفات |

### المهام
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Tasks | `/tasks` | قائمة المهام |
| TaskBoard | `/tasks/board` | لوحة Kanban (drag & drop) |

### الشركاء
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Partners | `/partners` | إدارة الشركاء وتوزيع الأرباح |
| PartnerStatement | `/partners/:id/statement` | كشف حساب شريك |

### النظام
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| Reports | `/reports` | تقارير متعددة العملات |
| Users | `/users` | إدارة المستخدمين + إعادة تعيين كلمة المرور |
| Notifications | `/notifications` | الإشعارات |
| ActivityLogs | `/activity-logs` | سجل النشاطات |
| Settings | `/settings` | إعدادات الشركة (الشعار + اللون) + الحساب الشخصي |

---

## ⚡ الميزات التقنية المتقدمة

### تحسين الأداء
- **React.lazy + Code Splitting** — جميع الـ 28 صفحة محملة بطريقة lazy loading
- **الحزمة الرئيسية** — 285 KB فقط (تم تقليلها من 1006 KB — تخفيض 72%)
- **30+ code-split chunks** — كل صفحة محملة بشكل منفصل

### التصميم
- **واجهة عربية بالكامل** (RTL) مع خط Cairo
- **Glassmorphism design** على صفحة اختيار الشركة
- **Gradient welcome banner** على الداشبورد
- **Area Charts** بتدرجات لونية على الرسوم البيانية
- **Donut Chart** لتوزيع المصروفات
- **CSS Animations** — fadeInUp, scaleIn, slideInRight, countUp
- **Staggered animations** — عناصر تظهر بالتتابع
- **Hover effects** — تكبير البطاقات وتغيير الألوان
- **Shimmer effect** على بطاقات الإحصائيات

### الأمان
- Token-based authentication (Sanctum)
- Role-based access control (5 أدوار)
- Middleware `CheckRole` على كل مجموعة routes
- التحقق من الصلاحيات على مستوى الـ Frontend والـ Backend
- تشفير كلمات المرور (bcrypt)
- 401 interceptor — تسجيل خروج تلقائي عند انتهاء الجلسة

### ميزات إضافية
- **تصدير CSV** مع BOM للغة العربية
- **فاتورة PDF عربية** قابلة للتحميل
- **نظام الإشعارات** مع جرس في الهيدر + عداد غير المقروءة
- **سجل النشاطات** — تتبع كل العمليات
- **نظام الأقساط** — توليد أقساط تلقائي من العقود
- **لوحة Kanban** — سحب وإفلات المهام
- **دعم عملات متعددة** (EGP, USD, SAR)
- **ملف عميل شامل** — عقود، فواتير، رصيد مستحق
- **كشف حساب الشريك** — تقرير سنوي مفصل
- **Error states** — أزرار إعادة المحاولة بالعربي على جميع صفحات القوائم

---

## 🔄 التحسينات الأخيرة (آخر جلسات العمل)

### الجلسة 1 — الإصلاحات والتحسينات الأساسية
1. ✅ **إصلاح خطأ 500 عند تسجيل الدخول** — كان بسبب CSRF (statefulApi). تم إزالته.
2. ✅ **إزالة "نسيت كلمة المرور"** — استبدالها بإعادة تعيين من الأدمن
3. ✅ **إجبار تغيير كلمة المرور** — migration + صفحة ChangePassword + redirect تلقائي
4. ✅ **إصلاح CSV العربي** — BOM (`\uFEFF`) موجود
5. ✅ **React.lazy optimization** — تقليل الحزمة الرئيسية 72%
6. ✅ **Error states** — أزرار retry على 8 صفحات

### الجلسة 2 — إدارة الشركات
1. ✅ **صفحة SelectCompany** — تصميم glassmorphism احترافي مع إنشاء شركة
2. ✅ **رفع شعار الشركة** — Backend يقبل image upload + يخزن في storage
3. ✅ **تعديل الشركة من الإعدادات** — رفع شعار + تعديل الاسم واللون
4. ✅ **إصلاح switchCompany** — كان يرجع company بدل user من الـ API
5. ✅ **CompanyResource** — يرجع URL كامل للشعار

### الجلسة 3 — التحسينات النهائية
1. ✅ **إصلاح خطأ 422 عند رفع الشعار** — كان بسبب `Content-Type: application/json` الافتراضي يتجاوز `multipart/form-data`. تم إصلاح axios interceptor.
2. ✅ **إعادة تصميم SelectCompany** — animated background orbs, staggered cards, badge ترحيبي, footer
3. ✅ **إعادة تصميم Dashboard بالكامل**:
   - بانر ترحيبي بتدرج لوني
   - بطاقات إحصائيات مع أيقونات gradient بدل الإيموجي
   - مؤشرات تغيير (↑ ↓) على كل بطاقة
   - Area Chart بتدرجات لونية بدل Bar Chart
   - Donut Chart بدل Pie Chart
   - قوائم فواتير ومهام بأيقونات ملونة وتأثيرات hover
   - Skeleton loading بدل spinner بسيط
   - حالات فارغة (empty states) لكل قسم
4. ✅ **CSS Animations** — إضافة 6 كيفريمات + 8 stagger delays + glass-card + stat-shimmer

---

## 📦 أمر التشغيل

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### بناء الإنتاج
```bash
cd frontend
npm run build
# الملفات في dist/
```

---

## 📐 حجم الحزمة (Production Build)

| الملف | الحجم | Gzip |
|-------|-------|------|
| index.js (main) | 285 KB | 94 KB |
| CartesianChart (recharts) | 341 KB | 101 KB |
| zod | 93 KB | 27 KB |
| TaskBoard | 88 KB | 27 KB |
| Dashboard | 41 KB | 12 KB |
| Reports | 34 KB | 11 KB |
| SelectCompany | 14 KB | 4 KB |
| index.css | 44 KB | 7 KB |
| **جميع الصفحات الأخرى** | 3-8 KB لكل صفحة | — |

---

## 🗂️ قاعدة البيانات (25 migration)

### الجداول الرئيسية
| الجدول | الأعمدة الرئيسية |
|--------|-----------------|
| companies | name, slug, logo, primary_color, is_active, settings |
| users | name, email, password, role, company_id, force_password_change |
| clients | name, phone, company_name, sector, service, status, company_id |
| contracts | client_id, value, currency, payment_type, start_date, end_date, status |
| invoices | contract_id, amount, currency, status, due_date, paid_date, paid_amount |
| invoice_payments | invoice_id, amount, paid_at, notes |
| installments | contract_id, amount, due_date, status |
| employees | name, position, base_salary, join_date, company_id |
| salary_payments | employee_id, month, year, base_salary, deductions, total |
| treasury_transactions | type, amount, currency, category, date, balance_after |
| expenses | category, amount, currency, date, notes, company_id |
| tasks | title, description, status, priority, due_date, assigned_to, created_by |
| task_comments | task_id, user_id, comment, attachment |
| partners | name, phone, bank_account, share_percentage |
| partner_payments | partner_id, amount, type, payment_date |
| notifications | user_id, type, title, body, read_at |
| activity_logs | user_id, action, model, model_id, changes |

---

## 🎨 تصميم الواجهة

### الصفحات الخاصة
- **Login** — تصميم split-screen مع branding على اليمين وفورم على اليسار
- **SelectCompany** — خلفية متحركة (animated orbs) + بطاقات glassmorphism + مودال إنشاء شركة
- **Dashboard** — بانر ترحيبي + بطاقات gradient + Area/Donut charts + قوائم محسنة

### المكونات المشتركة
- **Layout** — شريط جانبي قابل للطي + هيدر مع إشعارات + breadcrumb
- **NotificationBell** — جرس مع عداد + dropdown
- **EmptyState** — حالة فارغة موحدة
- **ErrorMessage** — رسالة خطأ مع زر إعادة محاولة
- **LoadingSpinner** — مؤشر تحميل

### الألوان
- Primary: Blue (#2563eb) — قابل للتخصيص لكل شركة
- Success: Emerald
- Warning: Amber
- Error: Rose
- Background: Gray-50/Gray-100

---

## ✅ الحالة النهائية

- **0 أخطاء TypeScript**
- **Build ناجح** في ~11 ثانية
- **88 route** مُصادق عليها
- **25 migration** مُنفذة
- **جميع الصفحات** تعمل بشكل كامل
- **جميع الـ Error States** مغطاة
- **رفع الملفات** يعمل (شعارات الشركات)
- **التصميم** احترافي وعربي بالكامل مع animations

---

> **ERPFlex** — تم بناؤه بالكامل كنظام ERP متكامل وجاهز للإنتاج.
