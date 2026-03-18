import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Search, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  params?: string;
  body?: string;
  roles?: string;
}

interface Section {
  title: string;
  description: string;
  endpoints: Endpoint[];
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
};

const apiSections: Section[] = [
  {
    title: 'المصادقة (Auth)',
    description: 'تسجيل الدخول والخروج وإدارة الجلسات',
    endpoints: [
      { method: 'POST', path: '/api/auth/login', description: 'تسجيل الدخول', body: '{ email, password }', roles: 'عام' },
      { method: 'POST', path: '/api/auth/logout', description: 'تسجيل الخروج', roles: 'مصادق' },
      { method: 'GET', path: '/api/auth/me', description: 'بيانات المستخدم الحالي', roles: 'مصادق' },
      { method: 'POST', path: '/api/auth/change-password', description: 'تغيير كلمة المرور', body: '{ current_password, password, password_confirmation }', roles: 'مصادق' },
    ],
  },
  {
    title: 'لوحة التحكم (Dashboard)',
    description: 'إحصائيات وبيانات لوحة التحكم الرئيسية',
    endpoints: [
      { method: 'GET', path: '/api/dashboard', description: 'بيانات لوحة التحكم حسب الصلاحية', params: 'year, date_from, date_to', roles: 'مصادق' },
    ],
  },
  {
    title: 'العملاء (Clients)',
    description: 'إدارة العملاء والبيانات المرتبطة',
    endpoints: [
      { method: 'GET', path: '/api/clients', description: 'قائمة العملاء', params: 'search, status, page, per_page', roles: 'super_admin, manager, sales' },
      { method: 'POST', path: '/api/clients', description: 'إنشاء عميل', body: '{ name, phone, company_name, sector, service, status, notes }', roles: 'super_admin, manager, sales' },
      { method: 'GET', path: '/api/clients/{id}', description: 'تفاصيل عميل', roles: 'super_admin, manager, sales' },
      { method: 'PUT', path: '/api/clients/{id}', description: 'تحديث عميل', roles: 'super_admin, manager, sales' },
      { method: 'DELETE', path: '/api/clients/{id}', description: 'حذف عميل', roles: 'super_admin, manager, sales' },
    ],
  },
  {
    title: 'العقود (Contracts)',
    description: 'إدارة العقود والأقساط',
    endpoints: [
      { method: 'GET', path: '/api/contracts', description: 'قائمة العقود', params: 'search, status, client_id, page', roles: 'super_admin, manager, sales, accountant' },
      { method: 'POST', path: '/api/contracts', description: 'إنشاء عقد', body: '{ client_id, value, currency, payment_type, start_date, end_date, installments_count, notes }', roles: 'super_admin, manager, sales, accountant' },
      { method: 'GET', path: '/api/contracts/{id}', description: 'تفاصيل عقد مع الفواتير', roles: 'super_admin, manager, sales, accountant' },
      { method: 'PUT', path: '/api/contracts/{id}', description: 'تحديث عقد', roles: 'super_admin, manager, sales, accountant' },
      { method: 'DELETE', path: '/api/contracts/{id}', description: 'حذف عقد', roles: 'super_admin, manager, sales, accountant' },
      { method: 'GET', path: '/api/contracts/{id}/installments', description: 'قائمة أقساط العقد', roles: 'super_admin, manager, sales, accountant' },
      { method: 'POST', path: '/api/contracts/{id}/installments/generate', description: 'توليد أقساط العقد', roles: 'super_admin, manager, sales, accountant' },
      { method: 'POST', path: '/api/installments/{id}/pay', description: 'تسديد قسط', roles: 'super_admin, manager, sales, accountant' },
    ],
  },
  {
    title: 'الفواتير (Invoices)',
    description: 'إدارة الفواتير والدفعات',
    endpoints: [
      { method: 'GET', path: '/api/invoices', description: 'قائمة الفواتير', params: 'status, client_id, month, year, page', roles: 'super_admin, manager, accountant' },
      { method: 'POST', path: '/api/invoices', description: 'إنشاء فاتورة', body: '{ contract_id, amount, currency, due_date, status }', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/invoices/{id}', description: 'تفاصيل فاتورة', roles: 'super_admin, manager, accountant' },
      { method: 'PUT', path: '/api/invoices/{id}', description: 'تحديث فاتورة', roles: 'super_admin, manager, accountant' },
      { method: 'DELETE', path: '/api/invoices/{id}', description: 'حذف فاتورة', roles: 'super_admin, manager, accountant' },
      { method: 'POST', path: '/api/invoices/{id}/payments', description: 'تسجيل دفعة', body: '{ amount, notes }', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/invoices/{id}/pdf', description: 'تنزيل الفاتورة PDF', roles: 'super_admin, manager, accountant' },
    ],
  },
  {
    title: 'عروض الأسعار (Quotations)',
    description: 'إنشاء وإدارة عروض الأسعار',
    endpoints: [
      { method: 'GET', path: '/api/quotations', description: 'قائمة عروض الأسعار', params: 'status, search, page', roles: 'super_admin, manager, sales, accountant' },
      { method: 'POST', path: '/api/quotations', description: 'إنشاء عرض أسعار', body: '{ client_id, items, discount_percentage, tax_percentage, valid_until, notes, currency }', roles: 'super_admin, manager, sales, accountant' },
      { method: 'GET', path: '/api/quotations/{id}', description: 'تفاصيل عرض أسعار', roles: 'super_admin, manager, sales, accountant' },
      { method: 'PUT', path: '/api/quotations/{id}', description: 'تحديث عرض أسعار', roles: 'super_admin, manager, sales, accountant' },
      { method: 'DELETE', path: '/api/quotations/{id}', description: 'حذف عرض أسعار', roles: 'super_admin, manager, sales, accountant' },
      { method: 'GET', path: '/api/quotations/{id}/pdf', description: 'تنزيل عرض الأسعار PDF', roles: 'super_admin, manager, sales, accountant' },
    ],
  },
  {
    title: 'تذاكر الدعم (Tickets)',
    description: 'نظام تذاكر الدعم والردود',
    endpoints: [
      { method: 'GET', path: '/api/tickets', description: 'قائمة التذاكر', params: 'status, priority, page', roles: 'مصادق' },
      { method: 'POST', path: '/api/tickets', description: 'إنشاء تذكرة', body: '{ subject, description, priority, category, client_id?, project_id?, assigned_to? }', roles: 'مصادق' },
      { method: 'GET', path: '/api/tickets/{id}', description: 'تفاصيل تذكرة مع الردود', roles: 'مصادق' },
      { method: 'PUT', path: '/api/tickets/{id}', description: 'تحديث تذكرة', roles: 'مصادق' },
      { method: 'DELETE', path: '/api/tickets/{id}', description: 'حذف تذكرة', roles: 'مصادق' },
      { method: 'POST', path: '/api/tickets/{id}/replies', description: 'إضافة رد على التذكرة', body: '{ body, is_internal? }', roles: 'مصادق' },
    ],
  },
  {
    title: 'العملاء المحتملين (Leads)',
    description: 'إدارة خط أنابيب المبيعات',
    endpoints: [
      { method: 'GET', path: '/api/leads', description: 'قائمة العملاء المحتملين', params: 'search, stage, source, assigned_to, page', roles: 'super_admin, manager, sales' },
      { method: 'POST', path: '/api/leads', description: 'إضافة عميل محتمل', body: '{ name, phone, email, source, service_type, expected_budget, temperature, notes }', roles: 'super_admin, manager, sales' },
      { method: 'GET', path: '/api/leads/{id}', description: 'تفاصيل عميل محتمل', roles: 'super_admin, manager, sales' },
      { method: 'PUT', path: '/api/leads/{id}', description: 'تحديث عميل محتمل', roles: 'super_admin, manager, sales' },
      { method: 'DELETE', path: '/api/leads/{id}', description: 'حذف عميل محتمل', roles: 'super_admin, manager, sales' },
      { method: 'POST', path: '/api/leads/{id}/stage', description: 'تحديث مرحلة العميل', body: '{ stage, lost_reason? }', roles: 'super_admin, manager, sales' },
      { method: 'POST', path: '/api/leads/{id}/convert', description: 'تحويل عميل محتمل إلى عميل + عقد', body: '{ contract_value, currency, payment_type, start_date, end_date?, installments_count? }', roles: 'super_admin, manager, sales' },
      { method: 'POST', path: '/api/leads/import', description: 'استيراد عملاء من CSV', body: 'FormData: file', roles: 'super_admin, manager, sales' },
      { method: 'GET', path: '/api/leads/import-template', description: 'تنزيل قالب الاستيراد CSV', roles: 'super_admin, manager, sales' },
      { method: 'GET', path: '/api/leads/{id}/activities', description: 'أنشطة العميل المحتمل', roles: 'super_admin, manager, sales' },
      { method: 'POST', path: '/api/leads/{id}/activities', description: 'إضافة نشاط', body: '{ type, notes, outcome?, next_followup_date?, attachment? }', roles: 'super_admin, manager, sales' },
    ],
  },
  {
    title: 'المبيعات (Sales)',
    description: 'تحليلات وتقارير المبيعات',
    endpoints: [
      { method: 'GET', path: '/api/sales/dashboard', description: 'لوحة تحليلات المبيعات', roles: 'super_admin, manager, sales' },
      { method: 'GET', path: '/api/sales/report', description: 'تقرير المبيعات التفصيلي', params: 'year', roles: 'super_admin, manager, sales' },
    ],
  },
  {
    title: 'الموظفين (Employees)',
    description: 'إدارة الموظفين والملفات',
    endpoints: [
      { method: 'GET', path: '/api/employees', description: 'قائمة الموظفين', params: 'search, page', roles: 'super_admin, manager' },
      { method: 'POST', path: '/api/employees', description: 'إضافة موظف', body: '{ name, position, phone, email, national_id, base_salary, join_date, ... }', roles: 'super_admin, manager' },
      { method: 'GET', path: '/api/employees/{id}', description: 'تفاصيل موظف', roles: 'super_admin, manager' },
      { method: 'PUT', path: '/api/employees/{id}', description: 'تحديث موظف', roles: 'super_admin, manager' },
      { method: 'DELETE', path: '/api/employees/{id}', description: 'حذف موظف', roles: 'super_admin, manager' },
      { method: 'POST', path: '/api/employees/{id}/files', description: 'رفع ملف للموظف', body: 'FormData: file, type', roles: 'super_admin, manager' },
      { method: 'DELETE', path: '/api/employees/{id}/files/{fileId}', description: 'حذف ملف موظف', roles: 'super_admin, manager' },
    ],
  },
  {
    title: 'الرواتب (Salaries)',
    description: 'إدارة دفعات الرواتب',
    endpoints: [
      { method: 'GET', path: '/api/salary-payments', description: 'قائمة دفعات الرواتب', params: 'month, year, employee_id, page', roles: 'super_admin, manager, accountant' },
      { method: 'POST', path: '/api/salary-payments', description: 'إنشاء دفعة راتب', body: '{ employee_id, month, year, base_salary, deductions, deduction_reason, transfer_amount }', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/salary-payments/{id}', description: 'تفاصيل دفعة', roles: 'super_admin, manager, accountant' },
      { method: 'PUT', path: '/api/salary-payments/{id}', description: 'تحديث دفعة', roles: 'super_admin, manager, accountant' },
    ],
  },
  {
    title: 'الخزينة والمصروفات (Treasury)',
    description: 'إدارة الخزينة والمصروفات',
    endpoints: [
      { method: 'GET', path: '/api/treasury/balance', description: 'رصيد الخزينة', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/treasury', description: 'قائمة حركات الخزينة', params: 'type, category, date_from, date_to, page', roles: 'super_admin, manager, accountant' },
      { method: 'POST', path: '/api/treasury', description: 'إضافة حركة خزينة', body: '{ type, amount, currency, category, date, description }', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/expenses', description: 'قائمة المصروفات', params: 'category, month, year, page', roles: 'super_admin, manager, accountant' },
      { method: 'POST', path: '/api/expenses', description: 'إضافة مصروف', body: '{ category, amount, currency, date, notes, reference_id }', roles: 'super_admin, manager, accountant' },
      { method: 'PUT', path: '/api/expenses/{id}', description: 'تحديث مصروف', roles: 'super_admin, manager, accountant' },
      { method: 'DELETE', path: '/api/expenses/{id}', description: 'حذف مصروف', roles: 'super_admin, manager, accountant' },
    ],
  },
  {
    title: 'المهام (Tasks)',
    description: 'إدارة المهام والتعليقات والقوائم',
    endpoints: [
      { method: 'GET', path: '/api/tasks', description: 'قائمة المهام', params: 'status, priority, project_id, assigned_to, search, page', roles: 'مصادق' },
      { method: 'POST', path: '/api/tasks', description: 'إنشاء مهمة', body: '{ title, description, status, priority, due_date, project_id, assignee_ids[], recurrence }', roles: 'مصادق' },
      { method: 'GET', path: '/api/tasks/{id}', description: 'تفاصيل مهمة', roles: 'مصادق' },
      { method: 'PUT', path: '/api/tasks/{id}', description: 'تحديث مهمة', roles: 'مصادق' },
      { method: 'DELETE', path: '/api/tasks/{id}', description: 'حذف مهمة', roles: 'مصادق' },
      { method: 'POST', path: '/api/tasks/{id}/comments', description: 'إضافة تعليق', body: '{ comment, attachment? }', roles: 'مصادق' },
      { method: 'GET', path: '/api/tasks/{id}/checklists', description: 'قائمة التحقق', roles: 'مصادق' },
      { method: 'POST', path: '/api/tasks/{id}/checklists', description: 'إضافة عنصر تحقق', body: '{ title }', roles: 'مصادق' },
      { method: 'PUT', path: '/api/tasks/{id}/checklists/{checklistId}', description: 'تحديث عنصر تحقق', body: '{ title?, is_completed? }', roles: 'مصادق' },
      { method: 'DELETE', path: '/api/tasks/{id}/checklists/{checklistId}', description: 'حذف عنصر تحقق', roles: 'مصادق' },
    ],
  },
  {
    title: 'المشاريع (Projects)',
    description: 'إدارة المشاريع والملفات',
    endpoints: [
      { method: 'GET', path: '/api/projects', description: 'قائمة المشاريع', params: 'search, status, page', roles: 'مصادق' },
      { method: 'POST', path: '/api/projects', description: 'إنشاء مشروع', body: '{ name, description, status, start_date, end_date, budget, currency, client_id }', roles: 'مصادق' },
      { method: 'GET', path: '/api/projects/{id}', description: 'تفاصيل مشروع', roles: 'مصادق' },
      { method: 'PUT', path: '/api/projects/{id}', description: 'تحديث مشروع', roles: 'مصادق' },
      { method: 'DELETE', path: '/api/projects/{id}', description: 'حذف مشروع', roles: 'مصادق' },
      { method: 'POST', path: '/api/projects/{id}/files', description: 'رفع ملف للمشروع', body: 'FormData: file', roles: 'مصادق' },
      { method: 'DELETE', path: '/api/projects/{id}/files/{fileId}', description: 'حذف ملف مشروع', roles: 'مصادق' },
    ],
  },
  {
    title: 'تتبع الوقت (Time Tracking)',
    description: 'تسجيل وتتبع ساعات العمل',
    endpoints: [
      { method: 'GET', path: '/api/time-entries', description: 'قائمة السجلات', params: 'task_id, project_id, user_id, date_from, date_to, page', roles: 'مصادق' },
      { method: 'POST', path: '/api/time-entries', description: 'إضافة سجل يدوي', body: '{ task_id, started_at, ended_at, description }', roles: 'مصادق' },
      { method: 'POST', path: '/api/time-entries/start', description: 'بدء تسجيل وقت', body: '{ task_id, description? }', roles: 'مصادق' },
      { method: 'POST', path: '/api/time-entries/stop', description: 'إيقاف تسجيل وقت', roles: 'مصادق' },
      { method: 'GET', path: '/api/time-entries/running', description: 'السجل الجاري حالياً', roles: 'مصادق' },
      { method: 'GET', path: '/api/time-entries/summary', description: 'ملخص الوقت', params: 'date_from, date_to', roles: 'مصادق' },
      { method: 'DELETE', path: '/api/time-entries/{id}', description: 'حذف سجل وقت', roles: 'مصادق' },
    ],
  },
  {
    title: 'الإجازات والحضور (Leave & Attendance)',
    description: 'إدارة الإجازات وتسجيل الحضور',
    endpoints: [
      { method: 'GET', path: '/api/leaves', description: 'قائمة طلبات الإجازة', params: 'status, type, page', roles: 'مصادق' },
      { method: 'POST', path: '/api/leaves', description: 'تقديم طلب إجازة', body: '{ type, start_date, end_date, reason }', roles: 'مصادق' },
      { method: 'POST', path: '/api/leaves/{id}/approve', description: 'الموافقة على طلب إجازة', roles: 'super_admin, manager' },
      { method: 'POST', path: '/api/leaves/{id}/reject', description: 'رفض طلب إجازة', body: '{ rejection_reason? }', roles: 'super_admin, manager' },
      { method: 'DELETE', path: '/api/leaves/{id}', description: 'حذف طلب إجازة (قيد الانتظار فقط)', roles: 'مصادق' },
      { method: 'GET', path: '/api/leaves/balance', description: 'رصيد الإجازات', roles: 'مصادق' },
      { method: 'GET', path: '/api/attendance', description: 'سجلات الحضور', params: 'user_id, month, year, page', roles: 'مصادق' },
      { method: 'POST', path: '/api/attendance', description: 'تسجيل حضور يدوي (مدير)', body: '{ user_id, date, check_in, check_out, status }', roles: 'super_admin, manager' },
      { method: 'POST', path: '/api/attendance/check-in', description: 'تسجيل حضور', roles: 'مصادق' },
      { method: 'POST', path: '/api/attendance/check-out', description: 'تسجيل انصراف', roles: 'مصادق' },
      { method: 'GET', path: '/api/attendance/today', description: 'سجل اليوم', roles: 'مصادق' },
      { method: 'GET', path: '/api/attendance/summary', description: 'ملخص الحضور الشهري', params: 'month, year', roles: 'مصادق' },
    ],
  },
  {
    title: 'الاجتماعات (Meetings)',
    description: 'إدارة الاجتماعات والمشاركين',
    endpoints: [
      { method: 'GET', path: '/api/meetings', description: 'قائمة الاجتماعات', params: 'type, status, page', roles: 'مصادق' },
      { method: 'POST', path: '/api/meetings', description: 'إنشاء اجتماع', body: '{ title, description, start_time, end_time, location, type, project_id, participant_ids[] }', roles: 'مصادق' },
      { method: 'GET', path: '/api/meetings/{id}', description: 'تفاصيل اجتماع', roles: 'مصادق' },
      { method: 'PUT', path: '/api/meetings/{id}', description: 'تحديث اجتماع', roles: 'مصادق' },
      { method: 'DELETE', path: '/api/meetings/{id}', description: 'حذف اجتماع', roles: 'مصادق' },
      { method: 'POST', path: '/api/meetings/{id}/respond', description: 'الرد على دعوة اجتماع', body: '{ status: accepted|declined|tentative }', roles: 'مصادق' },
    ],
  },
  {
    title: 'التقويم (Calendar)',
    description: 'عرض التقويم الموحد',
    endpoints: [
      { method: 'GET', path: '/api/calendar', description: 'أحداث التقويم (مهام + اجتماعات)', params: 'start, end', roles: 'مصادق' },
    ],
  },
  {
    title: 'البريد الإلكتروني (Email)',
    description: 'إرسال بريد من المنصة',
    endpoints: [
      { method: 'POST', path: '/api/email/send', description: 'إرسال بريد عام', body: '{ to, subject, body, sender_name? }', roles: 'super_admin, manager, sales, accountant' },
      { method: 'POST', path: '/api/email/invoice/{id}', description: 'إرسال فاتورة بالبريد', body: '{ to }', roles: 'super_admin, manager, sales, accountant' },
      { method: 'POST', path: '/api/email/quotation/{id}', description: 'إرسال عرض أسعار بالبريد', body: '{ to }', roles: 'super_admin, manager, sales, accountant' },
    ],
  },
  {
    title: 'أتمتة العمليات (Workflows)',
    description: 'قواعد أتمتة تلقائية',
    endpoints: [
      { method: 'GET', path: '/api/workflows', description: 'قائمة قواعد الأتمتة', params: 'trigger, active_only, page', roles: 'super_admin, manager' },
      { method: 'POST', path: '/api/workflows', description: 'إنشاء قاعدة أتمتة', body: '{ name, trigger, conditions?, action, action_config?, is_active }', roles: 'super_admin, manager' },
      { method: 'GET', path: '/api/workflows/{id}', description: 'تفاصيل قاعدة مع السجل', roles: 'super_admin, manager' },
      { method: 'PUT', path: '/api/workflows/{id}', description: 'تحديث قاعدة', roles: 'super_admin, manager' },
      { method: 'DELETE', path: '/api/workflows/{id}', description: 'حذف قاعدة', roles: 'super_admin, manager' },
      { method: 'POST', path: '/api/workflows/{id}/toggle', description: 'تفعيل/تعطيل قاعدة', roles: 'super_admin, manager' },
      { method: 'GET', path: '/api/workflow-logs', description: 'سجل تنفيذ الأتمتة', params: 'workflow_rule_id, status, page', roles: 'super_admin, manager' },
      { method: 'GET', path: '/api/workflow-templates', description: 'القوالب الجاهزة', roles: 'super_admin, manager' },
    ],
  },
  {
    title: 'الشركاء (Partners)',
    description: 'إدارة الشركاء والأرباح',
    endpoints: [
      { method: 'GET', path: '/api/partners', description: 'قائمة الشركاء', roles: 'super_admin, manager' },
      { method: 'POST', path: '/api/partners', description: 'إضافة شريك', body: '{ name, phone, bank_account, share_percentage, capital }', roles: 'super_admin, manager' },
      { method: 'PUT', path: '/api/partners/{id}', description: 'تحديث شريك', roles: 'super_admin, manager' },
      { method: 'DELETE', path: '/api/partners/{id}', description: 'حذف شريك', roles: 'super_admin, manager' },
      { method: 'GET', path: '/api/partners/profits', description: 'توزيع الأرباح', params: 'month, year', roles: 'super_admin, manager' },
      { method: 'GET', path: '/api/partners/monthly-profit', description: 'الربح الشهري', params: 'month, year', roles: 'super_admin, manager' },
      { method: 'GET', path: '/api/partners/{id}/statement', description: 'كشف حساب شريك', params: 'year', roles: 'super_admin, manager' },
      { method: 'GET', path: '/api/partners/{id}/payments', description: 'دفعات شريك', roles: 'super_admin, manager' },
      { method: 'POST', path: '/api/partners/{id}/payments', description: 'تسجيل دفعة لشريك', body: '{ amount, currency, type, payment_date, notes }', roles: 'super_admin, manager' },
      { method: 'DELETE', path: '/api/partners/{id}/payments/{paymentId}', description: 'حذف دفعة', roles: 'super_admin, manager' },
    ],
  },
  {
    title: 'المستخدمين (Users)',
    description: 'إدارة المستخدمين والصلاحيات',
    endpoints: [
      { method: 'GET', path: '/api/users', description: 'قائمة المستخدمين', roles: 'super_admin, manager' },
      { method: 'POST', path: '/api/users', description: 'إنشاء مستخدم', body: '{ name, email, password, role, permissions, phone }', roles: 'super_admin, manager' },
      { method: 'PUT', path: '/api/users/{id}', description: 'تحديث مستخدم', roles: 'super_admin, manager' },
      { method: 'DELETE', path: '/api/users/{id}', description: 'حذف مستخدم', roles: 'super_admin, manager' },
      { method: 'POST', path: '/api/users/{id}/reset-password', description: 'إعادة تعيين كلمة المرور', roles: 'super_admin, manager' },
      { method: 'GET', path: '/api/permissions/all', description: 'جميع الصلاحيات المتاحة', roles: 'super_admin, manager' },
      { method: 'GET', path: '/api/permissions/defaults/{role}', description: 'الصلاحيات الافتراضية للدور', roles: 'super_admin, manager' },
    ],
  },
  {
    title: 'التقارير (Reports)',
    description: 'تقارير مالية وتشغيلية',
    endpoints: [
      { method: 'GET', path: '/api/reports/monthly', description: 'التقرير الشهري', params: 'month, year', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/reports/yearly', description: 'التقرير السنوي', params: 'year', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/reports/clients', description: 'تقرير العملاء', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/reports/salaries', description: 'تقرير الرواتب', params: 'month, year', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/reports/treasury', description: 'تقرير الخزينة', params: 'month, year', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/reports/partners', description: 'تقرير الشركاء', params: 'year', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/reports/profit-loss', description: 'تقرير الأرباح والخسائر', params: 'year, date_from, date_to', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/reports/cash-flow', description: 'تقرير التدفقات النقدية', params: 'year, date_from, date_to', roles: 'super_admin, manager, accountant' },
      { method: 'GET', path: '/api/reports/employees', description: 'تقرير أداء الموظفين', params: 'month, year', roles: 'مصادق' },
    ],
  },
  {
    title: 'الإشعارات (Notifications)',
    description: 'إدارة الإشعارات',
    endpoints: [
      { method: 'GET', path: '/api/notifications', description: 'قائمة الإشعارات', params: 'page', roles: 'مصادق' },
      { method: 'GET', path: '/api/notifications/unread-count', description: 'عدد الإشعارات غير المقروءة', roles: 'مصادق' },
      { method: 'POST', path: '/api/notifications/{id}/read', description: 'تحديد إشعار كمقروء', roles: 'مصادق' },
      { method: 'POST', path: '/api/notifications/read-all', description: 'تحديد الكل كمقروء', roles: 'مصادق' },
    ],
  },
  {
    title: 'النظام (System)',
    description: 'سجل النشاطات وقوالب الملفات والمكتبة',
    endpoints: [
      { method: 'GET', path: '/api/activity-logs', description: 'سجل النشاطات', params: 'page', roles: 'مصادق' },
      { method: 'GET', path: '/api/file-templates', description: 'قوالب الملفات', roles: 'super_admin, manager' },
      { method: 'POST', path: '/api/file-templates', description: 'رفع قالب', body: 'FormData: file, name, category, description', roles: 'super_admin, manager' },
      { method: 'PUT', path: '/api/file-templates/{id}', description: 'تحديث قالب', roles: 'super_admin, manager' },
      { method: 'DELETE', path: '/api/file-templates/{id}', description: 'حذف قالب', roles: 'super_admin, manager' },
      { method: 'GET', path: '/api/media', description: 'مكتبة الملفات الموحدة', params: 'source, search, page', roles: 'مصادق' },
    ],
  },
];

export default function ApiDocs() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const toggleSection = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    toast.success('تم نسخ المسار');
  };

  const filteredSections = search
    ? apiSections.map(s => ({
        ...s,
        endpoints: s.endpoints.filter(e =>
          e.path.toLowerCase().includes(search.toLowerCase()) ||
          e.description.includes(search)
        ),
      })).filter(s => s.endpoints.length > 0)
    : apiSections;

  const totalEndpoints = apiSections.reduce((sum, s) => sum + s.endpoints.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl text-white">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">توثيق الـ API</h1>
            <p className="text-sm text-gray-500">{totalEndpoints} نقطة نهاية في {apiSections.length} قسم</p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-medium text-gray-700 mb-1">Base URL</h3>
          <code className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">https://erpflex.online/backend</code>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-medium text-gray-700 mb-1">المصادقة</h3>
          <code className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">Authorization: Bearer {'<token>'}</code>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-medium text-gray-700 mb-1">Content-Type</h3>
          <code className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded">application/json</code>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث في المسارات والأوصاف..."
          className="w-full border rounded-lg pr-10 pl-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-xl border overflow-hidden">
            <button
              onClick={() => toggleSection(idx)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="text-right">
                <h2 className="font-bold text-gray-900">{section.title}</h2>
                <p className="text-sm text-gray-500">{section.description} • {section.endpoints.length} نقطة</p>
              </div>
              {expanded.has(idx) ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
            </button>

            {expanded.has(idx) && (
              <div className="border-t">
                {section.endpoints.map((ep, epIdx) => (
                  <div key={epIdx} className="border-b last:border-b-0 p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${methodColors[ep.method]}`}>
                        {ep.method}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-gray-800 font-mono break-all">{ep.path}</code>
                          <button onClick={() => copyPath(ep.path)} className="shrink-0 p-1 hover:bg-gray-200 rounded">
                            <Copy size={12} className="text-gray-400" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{ep.description}</p>
                        {ep.params && (
                          <p className="text-xs text-gray-400 mt-1">
                            <span className="font-medium text-gray-500">Query: </span>{ep.params}
                          </p>
                        )}
                        {ep.body && (
                          <p className="text-xs text-gray-400 mt-1">
                            <span className="font-medium text-gray-500">Body: </span>
                            <code className="text-xs">{ep.body}</code>
                          </p>
                        )}
                        {ep.roles && (
                          <p className="text-xs text-gray-400 mt-1">
                            <span className="font-medium text-gray-500">الصلاحيات: </span>{ep.roles}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
