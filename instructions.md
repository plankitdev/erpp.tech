
# ERPFlex — Multi-Tenant ERP System
> Copilot Instructions — Read this before suggesting any code.

---

## 🧠 Project Overview
ERPFlex is a multi-tenant ERP & accounting system built for managing
multiple companies from a single platform. Each company has its own
isolated data, users, clients, financials, and tasks.

Current companies:
- PlanKit Dev (Software Company)
- PlanKit Marketing (Marketing Agency)

Super Admin can select which company to manage after login.
Each user belongs to exactly ONE company and is redirected automatically.

---

## ⚙️ Tech Stack
- **Backend**: Laravel 11, PHP 8.2
- **Frontend**: React 18, TypeScript, TailwindCSS
- **Database**: MySQL 8
- **Auth**: Laravel Sanctum (SPA)
- **File Storage**: Laravel Storage (local/S3)
- **API**: RESTful JSON API

---

## 🏗️ Architecture Rules

### Multi-Tenancy
- EVERY model that belongs to a company MUST have `company_id` column
- EVERY query MUST be scoped with `company_id` via Global Scope
- NEVER return data without filtering by the authenticated user's company_id
- Use `CompanyScope` trait on all tenant models

```php
// Always apply this pattern
protected static function booted(): void
{
    static::addGlobalScope(new CompanyScope());
}
Tenant Isolation Rule
Company A users can NEVER access Company B data — enforce at model level

Super Admin bypasses tenant scope using withoutGlobalScope(CompanyScope::class)

📁 Folder Structure
Backend (Laravel)
text
app/
├── Http/
│   ├── Controllers/Api/     ← All API controllers here
│   ├── Requests/            ← Form Requests for all validation
│   ├── Resources/           ← API Resources for all responses
│   └── Middleware/          ← Auth, TenantScope, RoleCheck
├── Models/                  ← All Eloquent models
├── Scopes/                  ← CompanyScope and other global scopes
├── Traits/                  ← ApiResponse, HasCompany, etc.
├── Services/                ← Business logic (InvoiceService, SalaryService)
└── Policies/                ← Authorization policies per model
Frontend (React)
text
src/
├── pages/          ← One folder per module (clients, invoices, tasks...)
├── components/     ← Reusable UI components
├── hooks/          ← Custom hooks (useClients, useInvoices...)
├── store/          ← Zustand global state
├── api/            ← Axios API calls per module
├── types/          ← TypeScript interfaces
└── utils/          ← Helpers (currency formatter, date formatter...)
🔑 Roles & Permissions
Five roles exist per company:

super_admin — Full access across all companies

manager — Full access within their company

accountant — Financial modules + read employees

sales — Clients, contracts, invoices only

employee — Own tasks + own profile + own salary view only

Always check role in controllers using: $request->user()->hasRole('manager')
Use Laravel Policies for all resource authorization.

💰 Currency Rules
Supported currencies: EGP, USD, SAR

ALWAYS store: amount (decimal 10,2) + currency_code (varchar 3)

NEVER auto-convert currencies — store original values

Display format: 3,000.00 EGP or 500.00 USD

📐 Coding Conventions
PHP / Laravel
Models: singular PascalCase → Client, Invoice, SalaryPayment

Controllers: always ResourceControllers → ClientController

ALWAYS use FormRequest for validation — never validate in controller

ALWAYS use ApiResource for responses — never return raw model

Use ApiResponse trait for consistent JSON responses:

php
return $this->successResponse($data, 'Clients retrieved', 200);
return $this->errorResponse('Not found', 404);
Soft deletes on: clients, employees, contracts

Log all actions using activity() from Spatie Activity Log

TypeScript / React
All components must be typed — no any

Use React Hook Form + Zod for all forms

Use TanStack Query for all API calls (no raw fetch/axios in components)

Use TanStack Table for all data tables

Use Zustand for auth state and company context

All pages must support RTL Arabic: dir="rtl"

All monetary values displayed using formatCurrency(amount, currency) util

🗄️ Database Conventions
All tables have: id, company_id, created_at, updated_at

Soft-deletable tables also have: deleted_at

Foreign keys: always constrained with cascadeOnDelete or nullOnDelete

Enums stored as strings with defined constants in Model

Index on: company_id, status, created_at for all major tables

🔁 Standard Development Order
For EVERY new module, always follow this sequence:

Migration

Model (with CompanyScope, fillable, relations)

FormRequest (Store + Update)

ApiResource

Controller (index, store, show, update, destroy)

Policy

Route (in api.php under auth:sanctum middleware)

React Type Interface

API hook (useQuery/useMutation)

UI Page + Components

🚫 What To Avoid
Never use Request $request directly for validation — use FormRequest

Never skip company_id scope on any query

Never return passwords or sensitive fields in API Resources

Never put business logic in Controllers — use Services

Never use inline styles — TailwindCSS only

Never hardcode Arabic text in components — use i18n keys

text

***

# 📄 الملف الثاني: `PHASES.md`

```markdown
# ERPFlex — Development Phases
> Roadmap for building the system module by module.

---

## 🎯 Phase 0 — Project Setup
**Duration: 2-3 days**

### Backend
- [ ] Laravel 11 fresh install
- [ ] Configure MySQL database
- [ ] Install packages:
  - `laravel/sanctum` — Auth
  - `spatie/laravel-permission` — Roles & Permissions
  - `spatie/laravel-activitylog` — Activity logging
  - `spatie/laravel-medialibrary` — File management
- [ ] Create `ApiResponse` trait
- [ ] Create `CompanyScope` global scope
- [ ] Create base `Migration`, `Model`, `Controller` stubs
- [ ] Configure CORS for React frontend

### Frontend
- [ ] React 18 + TypeScript (Vite)
- [ ] Install packages:
  - `tailwindcss`
  - `@tanstack/react-query`
  - `@tanstack/react-table`
  - `react-hook-form` + `zod`
  - `zustand`
  - `axios`
  - `react-router-dom v6`
- [ ] Setup RTL TailwindCSS config
- [ ] Create `formatCurrency()` utility
- [ ] Create `formatDate()` utility (Arabic locale)
- [ ] Create base `ApiResponse` TypeScript type
- [ ] Setup Axios instance with Sanctum token interceptor

---

## 🔐 Phase 1 — Auth & Multi-Tenant
**Duration: 3-4 days**

### Backend
- [ ] `companies` table migration + Model
- [ ] `users` table with `company_id` + `role` columns
- [ ] Login API → returns user + company info + token
- [ ] Super Admin: get list of companies API
- [ ] Super Admin: switch company API
- [ ] `RoleMiddleware` for protecting routes by role
- [ ] `EnsureUserBelongsToCompany` middleware

### Frontend
- [ ] Login page (Arabic RTL)
- [ ] Super Admin → Company selector screen
- [ ] Store selected company in Zustand
- [ ] Protected Route component (checks auth + role)
- [ ] Sidebar with role-based menu items
- [ ] Main layout with company name + user info in header

**✅ Deliverable: Login works, Super Admin selects company, users land on their company dashboard.**

---

## 👥 Phase 2 — Clients & Contracts
**Duration: 4-5 days**

### Backend
- [ ] `clients` migration + Model + CompanyScope
- [ ] `contracts` migration + Model (payment_type: monthly/installments)
- [ ] `ClientController` — full CRUD
- [ ] `ContractController` — full CRUD
- [ ] `ClientResource` + `ContractResource`
- [ ] `StoreClientRequest` + `UpdateClientRequest`
- [ ] Filter clients by: status, service, payment_type
- [ ] Endpoint: get client with all contracts + outstanding balance

### Frontend
- [ ] Clients list page — searchable, filterable table
- [ ] Add/Edit client form (modal or page)
- [ ] Client profile page:
  - [ ] Basic info
  - [ ] Contracts list with status badges
  - [ ] Total contract value + collected + outstanding
- [ ] Contract add/edit form with payment type toggle

**✅ Deliverable: Full client & contract management per company.**

---

## 🧾 Phase 3 — Invoices & Collections
**Duration: 4-5 days**

### Backend
- [ ] `invoices` migration + Model
- [ ] `invoice_payments` migration + Model
- [ ] Auto-generate monthly invoices for monthly-payment clients
- [ ] `InvoiceController` — CRUD + mark as paid
- [ ] `InvoicePaymentController` — add partial payments
- [ ] Invoice statuses: `pending`, `paid`, `overdue`, `partial`
- [ ] Endpoint: outstanding balance per client
- [ ] Scheduled command: flag overdue invoices daily

### Frontend
- [ ] Invoices list — filterable by status, month, client
- [ ] Invoice detail page with payments history
- [ ] Add payment modal (amount + currency + date + notes)
- [ ] Outstanding balance widget on client profile
- [ ] Overdue invoices alert on dashboard

**✅ Deliverable: Full invoice tracking with multi-currency payments.**

---

## 💵 Phase 4 — Salaries & HR
**Duration: 4-5 days**

### Backend
- [ ] `employees` migration + Model
- [ ] `salary_payments` migration + Model
- [ ] `employee_files` migration + Model
- [ ] `EmployeeController` — CRUD
- [ ] `SalaryPaymentController` — generate monthly, record payment
- [ ] `EmployeeFileController` — upload, list, send to employee
- [ ] Salary: base_salary, deductions (with reason), total, transfer, remaining
- [ ] File types: contract, document, payslip, other

### Frontend
- [ ] Employees list page
- [ ] Employee profile page:
  - [ ] Basic info + contract details
  - [ ] Files section (upload + send + download)
  - [ ] Salary history table
- [ ] Monthly salary run page:
  - [ ] List all employees
  - [ ] Edit deductions per employee
  - [ ] Mark as paid with date
- [ ] Payslip view (printable)

**✅ Deliverable: Full HR module with salary history and file management.**

---

## 🏦 Phase 5 — Treasury (Khazina)
**Duration: 3-4 days**

### Backend
- [ ] `treasury_transactions` migration + Model
- [ ] Auto-create transaction on: invoice payment received, salary paid, expense added
- [ ] `TreasuryController` — list transactions, get current balance
- [ ] `ExpenseController` — add/edit/delete expenses
- [ ] Balance calculation: running balance after each transaction
- [ ] Filter by: date range, category, currency, type (in/out)

### Frontend
- [ ] Treasury page:
  - [ ] Current balance widget (per currency)
  - [ ] Transactions table with filters
  - [ ] Add expense form
- [ ] Transaction categories with color coding:
  - 🟢 Revenue (invoice payments)
  - 🔴 Salaries
  - 🟠 Client expenses
  - 🔵 Other expenses

**✅ Deliverable: Real-time treasury with full transaction history.**

---

## 🤝 Phase 6 — Partners & Profit Sharing
**Duration: 2-3 days**

### Backend
- [ ] `partners` migration + Model (name, share_percentage)
- [ ] `PartnerController` — CRUD
- [ ] Profit calculation: revenue - expenses - salaries = net profit
- [ ] Partner share = net_profit × (share_percentage / 100)
- [ ] Monthly + annual profit distribution report

### Frontend
- [ ] Partners management page
- [ ] Profit distribution widget on dashboard
- [ ] Partners report:
  - [ ] Net profit per month
  - [ ] Each partner's share (amount + percentage)
  - [ ] Annual summary

**✅ Deliverable: Automated profit distribution per partner per period.**

---

## ✅ Phase 7 — Task Management
**Duration: 4-5 days**

### Backend
- [ ] `tasks` migration + Model
- [ ] `task_comments` migration + Model
- [ ] `TaskController` — CRUD + assign + change status
- [ ] `TaskCommentController` — add comment + attachment
- [ ] Filter: by assignee, status, priority, client, due date
- [ ] Employee can only see their own tasks

### Frontend
- [ ] Kanban board (Todo → In Progress → Review → Done)
- [ ] Task card: title, assignee avatar, priority badge, due date, client tag
- [ ] Task detail drawer/page:
  - [ ] Full description
  - [ ] Comments thread
  - [ ] File attachments
  - [ ] Status changer
- [ ] Tasks list view (alternative to Kanban)
- [ ] My Tasks page for employees

**✅ Deliverable: Full task management with Kanban and comments.**

---

## 📊 Phase 8 — Reports & Dashboard
**Duration: 4-5 days**

### Backend
Endpoints for:
- [ ] Monthly P&L report (revenue, expenses, salaries, net profit)
- [ ] Annual report (12-month comparison)
- [ ] Client collections report (collected vs outstanding)
- [ ] Salary report (per employee per month)
- [ ] Treasury cash flow report
- [ ] Partner profit distribution report
- [ ] Outstanding invoices aging report

### Frontend
- [ ] Main Dashboard:
  - [ ] Revenue this month widget
  - [ ] Expenses this month widget
  - [ ] Outstanding balance widget
  - [ ] Net profit widget
  - [ ] Active clients count
  - [ ] Overdue invoices alert
  - [ ] Tasks due today
- [ ] Reports section:
  - [ ] Monthly report page with charts
  - [ ] Annual report with bar chart (12 months)
  - [ ] Export to PDF button on every report
  - [ ] Print-friendly view

**✅ Deliverable: Full analytics and reporting dashboard.**

---

## 🔔 Phase 9 — Notifications & Polish
**Duration: 3-4 days**

- [ ] In-app notifications:
  - Invoice overdue
  - Task assigned to you
  - File sent to you
  - Salary paid
- [ ] Notification bell in header with unread count
- [ ] Mark as read / mark all as read
- [ ] Activity log page (Super Admin sees all actions)
- [ ] Full Arabic UI review (RTL consistency)
- [ ] Mobile responsive check (all pages)
- [ ] Loading states and empty states for all pages
- [ ] Error handling and toast notifications

**✅ Deliverable: Production-ready polished system.**

---
