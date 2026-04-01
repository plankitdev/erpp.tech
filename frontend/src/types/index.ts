// ========== API Response Types ==========
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ========== Auth ==========
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
    company: Company | null;
    force_password_change?: boolean;
  };
}

// ========== User ==========
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  phone: string | null;
  avatar: string | null;
  is_active: boolean;
  company: Company | null;
  last_login_at: string | null;
  created_at: string;
}

export type UserRole = 'super_admin' | 'manager' | 'accountant' | 'sales' | 'employee' | 'marketing_manager';

// ========== Permissions ==========
export interface PermissionsData {
  permissions: Record<string, string[]>;
  permission_labels: Record<string, string>;
  action_labels: Record<string, string>;
}

// ========== Company ==========
export interface Company {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  icon: string | null;
  primary_color: string | null;
  is_active: boolean;
  users_count?: number;
  created_at: string;
}

// ========== Client ==========
export interface Client {
  id: number;
  slug: string;
  name: string;
  phone: string | null;
  company_name: string | null;
  sector: string | null;
  service: string | null;
  status: ClientStatus;
  notes: string | null;
  monthly_payment?: number | null;
  payment_day?: number | null;
  total_outstanding?: number;
  total_expenses?: number;
  total_paid?: number;
  active_contract?: Contract;
  contracts?: Contract[];
  projects?: Project[];
  tasks?: Task[];
  created_at: string;
}

export interface ClientFinancialSummary {
  id: number;
  name: string;
  slug: string;
  service: string | null;
  contract_value: number;
  total_expenses: number;
  monthly_payment: number;
  outstanding: number;
  notes: string | null;
}

export type ClientStatus = 'active' | 'inactive' | 'lead';

// ========== Contract ==========
export interface Contract {
  id: number;
  client_id: number;
  value?: number;
  currency?: Currency;
  payment_type: PaymentType;
  start_date: string;
  end_date: string | null;
  installments_count?: number | null;
  installment_amount?: number | null;
  status: ContractStatus;
  notes: string | null;
  client?: Client;
  invoices?: Invoice[];
  created_at: string;
}

export type ContractStatus = 'active' | 'completed' | 'cancelled';
export type PaymentType = 'monthly' | 'installments' | 'one_time';
export type Currency = 'EGP' | 'USD' | 'SAR';

// ========== Invoice ==========
export interface Invoice {
  id: number;
  contract_id: number | null;
  client_id?: number | null;
  amount: number;
  currency: Currency;
  status: InvoiceStatus;
  due_date: string;
  issue_date?: string | null;
  paid_date: string | null;
  paid_amount: number;
  remaining: number;
  contract?: Contract;
  client?: { id: number; name: string } | null;
  payments?: InvoicePayment[];
  created_at: string;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'partial';

export interface InvoicePayment {
  id: number;
  amount: number;
  paid_at: string;
  notes: string | null;
}

// ========== Employee ==========
export interface Employee {
  id: number;
  name: string;
  position: string;
  phone: string | null;
  email: string | null;
  national_id: string | null;
  address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  base_salary: number;
  salary?: number;
  is_active?: boolean;
  department?: string;
  role?: string;
  join_date: string;
  contract_start: string | null;
  contract_end: string | null;
  contract_file: string | null;
  notes: string | null;
  user?: User;
  files?: EmployeeFile[];
  salary_payments?: SalaryPayment[];
  files_count?: number;
  created_at: string;
}

export interface EmployeeFile {
  id: number;
  file_name: string;
  file_path: string;
  type: string | null;
  uploaded_by?: User;
  sent_at: string | null;
  created_at: string;
}

// ========== File Template ==========
export interface FileTemplate {
  id: number;
  name: string;
  category: 'invoice' | 'contract' | 'plan' | 'proposal' | 'report' | 'other';
  description: string | null;
  file_path: string;
  file_type: string | null;
  file_size: number;
  uploaded_by?: User;
  created_at: string;
}

// ========== Salary Payment ==========
export interface SalaryPayment {
  id: number;
  month: number;
  year: number;
  base_salary: number;
  bonus: number;
  bonus_reason: string | null;
  deductions: number;
  deduction_reason: string | null;
  total: number;
  transfer_amount: number;
  remaining: number;
  payment_date: string | null;
  employee?: Employee;
  created_at: string;
}

// ========== Treasury ==========
export interface TreasuryTransaction {
  id: number;
  type: 'in' | 'out';
  amount: number;
  currency: Currency;
  category: string;
  date: string;
  description: string;
  balance_after: number;
  created_at: string;
}

// ========== Project ==========
export interface Project {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  budget?: number | null;
  currency?: Currency;
  client: Client | null;
  created_by: User | null;
  tasks_count: number;
  completed_tasks_count: number;
  progress: number;
  files_count: number;
  tasks?: Task[];
  files?: ProjectFile[];
  created_at: string;
}

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled';

export interface ProjectFile {
  id: number;
  name: string;
  file_path: string;
  file_type: string | null;
  file_size: number;
  uploaded_by: User | null;
  created_at: string;
}

export interface TaskFile {
  id: number;
  name: string;
  file_path: string;
  file_type: string | null;
  file_size: number;
  uploaded_by: User | null;
  created_at: string;
}

// ========== Task ==========
export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  recurrence: TaskRecurrence;
  next_recurrence_date: string | null;
  due_date: string | null;
  start_date: string | null;
  assigned_to: User | null;
  assignees: User[];
  created_by: User | null;
  client: Client | null;
  project_id?: number | null;
  project: Project | null;
  parent_id: number | null;
  parent: Task | null;
  subtasks: Task[];
  subtasks_count: number;
  completed_subtasks_count: number;
  assignee_ids?: number[];
  comments?: TaskComment[];
  files?: TaskFile[];
  checklists?: TaskChecklist[];
  total_time?: number;
  checklist_progress?: { total: number; completed: number };
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface TaskComment {
  id: number;
  comment: string;
  attachment: string | null;
  user?: User;
  created_at: string;
}

// ========== Employee Report ==========
export interface EmployeeReportData {
  month: number;
  year: number;
  employees: EmployeeReportItem[];
  summary: {
    total_employees: number;
    total_tasks: number;
    total_completed: number;
    total_in_progress: number;
    total_overdue: number;
    avg_completion_rate: number;
  };
}

export interface EmployeeReportItem {
  employee_id: number;
  name: string;
  position: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

// ========== Partner ==========
export interface Partner {
  id: number;
  name: string;
  phone?: string;
  bank_account?: string;
  share_percentage: number;
  capital: number;
  is_active: boolean;
  payments_count?: number;
  payments_sum_amount?: number;
  created_at: string;
}

export interface PartnerPayment {
  id: number;
  partner_id: number;
  amount: number;
  currency: string;
  month: number;
  year: number;
  payment_date: string;
  type: 'profit_share' | 'advance' | 'expense' | 'withdrawal' | 'capital_contribution' | 'deposit';
  notes?: string;
}

export interface MonthlyProfitData {
  month: number;
  year: number;
  revenue: number;
  expenses: number;
  salaries: number;
  net_profit: number;
  distribution: PartnerDistribution[];
}

export interface PartnerDistribution {
  id: number;
  name: string;
  share_percentage: number;
  capital: number;
  phone?: string;
  bank_account?: string;
  entitlement: number;
  received: number;
  remaining: number;
}

export interface PartnerStatementData {
  partner: {
    id: number;
    name: string;
    share_percentage: number;
    capital: number;
    phone?: string;
    bank_account?: string;
    is_active: boolean;
    created_at: string;
  };
  year: number;
  months: {
    month: number;
    month_name: string;
    revenue: number;
    expenses: number;
    salaries: number;
    net_profit: number;
    entitlement: number;
    total: number;
    inflow: number;
    outflow: number;
    payments: {
      id: number;
      amount: number;
      currency: string;
      type: string;
      payment_date: string;
      notes?: string;
    }[];
  }[];
  total_entitlement: number;
  total_received: number;
  total_inflow: number;
  total_outflow: number;
  by_type: Record<string, number>;
}

// ========== Dashboard ==========
export interface DashboardData {
  clients_count: number;
  active_contracts: number;
  pending_invoices: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  monthly_revenue: MonthlyData[];
  expense_distribution: ExpenseCategory[];
  recent_invoices: RecentInvoice[];
  recent_tasks: RecentTask[];
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

export interface ExpenseCategory {
  name: string;
  value: number;
}

export interface RecentInvoice {
  id: number;
  client_name: string | null;
  amount: number;
  currency: Currency;
  due_date: string | null;
  status: InvoiceStatus;
}

export interface RecentTask {
  id: number;
  title: string;
  assigned_to_name: string | null;
  status: TaskStatus;
}

// ========== Notification ==========
export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
}

export type NotificationType = 'invoice_overdue' | 'task_assigned' | 'file_sent' | 'salary_paid' | 'contract_expiring' | 'task_overdue' | 'lead_new' | 'lead_won' | 'project_created' | 'expense_created' | 'meeting_reminder' | 'payment_received' | 'task_completed';

// ========== Expense ==========
export interface Expense {
  id: number;
  company_id: number;
  client_id?: number | null;
  category: string;
  amount: number;
  currency: Currency;
  date: string;
  notes: string | null;
  reference_id: string | null;
  client?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

// ========== Sales Pipeline ==========
export type LeadStage = 'new' | 'first_contact' | 'proposal_sent' | 'negotiation' | 'contract_signed' | 'lost';
export type LeadTemperature = 'hot' | 'warm' | 'cold';
export type LeadSource = 'ad' | 'referral' | 'website' | 'social' | 'other';
export type LeadServiceType = 'marketing' | 'design' | 'moderation' | 'development' | 'other';
export type LeadActivityType = 'call' | 'message' | 'email' | 'proposal_sent' | 'meeting' | 'followup';
export type LeadActivityOutcome = 'positive' | 'neutral' | 'negative';

export interface Lead {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  source: LeadSource;
  service_type: LeadServiceType;
  expected_budget: number | null;
  stage: LeadStage;
  temperature: LeadTemperature;
  lost_reason: string | null;
  first_contact_date: string | null;
  last_followup_date: string | null;
  notes: string | null;
  proposal_file: string | null;
  proposed_amount: number | null;
  final_amount: number | null;
  assigned_to: { id: number; name: string } | null;
  converted_client_id: number | null;
  activities_count?: number;
  activities?: LeadActivity[];
  created_at: string;
}

export interface LeadActivity {
  id: number;
  type: LeadActivityType;
  notes: string | null;
  attachment: string | null;
  outcome: LeadActivityOutcome | null;
  next_followup_date: string | null;
  user: { id: number; name: string } | null;
  created_at: string;
}

export interface SalesDashboardData {
  total_leads: number;
  conversion_rate: number;
  stuck_leads: number;
  lost_leads: number;
  new_this_month: number;
  pipeline: Record<string, { count: number; total_budget: number }>;
  by_source: Record<string, number>;
  by_service: Record<string, number>;
  team_performance: { user_id: number; name: string; total: number }[];
}

export interface SalesReportData {
  summary: {
    total_leads: number;
    converted_leads: number;
    conversion_rate: number;
    total_contract_value: number;
    avg_contract_value: number;
  };
  sales_performance: {
    user_id: number;
    name: string;
    leads_count: number;
    converted_count: number;
    total_value: number;
    conversion_rate: number;
  }[];
  by_source: Record<string, number>;
  conversion_trend: {
    month: string;
    label: string;
    total_leads: number;
    converted: number;
    rate: number;
  }[];
}

export interface LeadImportResult {
  imported: number;
  failed: number;
  errors: string[];
}

// ========== Task Checklist ==========
export interface TaskChecklist {
  id: number;
  task_id: number;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

// ========== Time Entry ==========
export interface TimeEntry {
  id: number;
  task_id: number;
  user_id: number;
  project_id: number | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  description: string | null;
  task?: Task;
  user?: User;
  project?: Project;
  created_at: string;
}

export interface TimeSummary {
  total_minutes: number;
  total_hours: number;
  by_user: { user_id: number; total: number; user?: { id: number; name: string } }[];
  by_project: { project_id: number; total: number; project?: { id: number; name: string } }[];
}

// ========== Meeting ==========
export interface Meeting {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_link: string | null;
  type: MeetingType;
  status: MeetingStatus;
  project_id: number | null;
  created_by: number;
  notes: string | null;
  creator?: User;
  project?: Project;
  participants: (User & { pivot?: { status: string } })[];
  created_at: string;
}

export type MeetingType = 'team' | 'sales' | 'client' | 'other';
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// ========== Calendar ==========
export interface CalendarEvent {
  id: number;
  title: string;
  type: 'task' | 'meeting';
  start: string;
  end: string;
  status: string;
  priority?: string;
  meeting_type?: string;
  location?: string;
  project?: string;
  assignee?: string;
  creator?: string;
  participants_count?: number;
}

// ========== Media ==========
export interface MediaFile {
  id: number;
  name: string;
  path: string;
  mime_type: string | null;
  size: number | null;
  source: 'project' | 'employee' | 'task';
  source_name: string | null;
  source_id: number;
  uploaded_by: number | null;
  created_at: string;
}

// ========== Enhanced Dashboard ==========
export interface DashboardDataV2 {
  role: string;
  // Common
  recent_tasks: RecentTask[];
  upcoming_meetings: { id: number; title: string; start_time: string; type: string; participants_count: number }[];
  // Manager/Admin
  clients_count?: number;
  active_contracts?: number;
  pending_invoices?: number;
  total_revenue?: number;
  total_expenses?: number;
  net_profit?: number;
  total_projects?: number;
  active_projects?: number;
  total_tasks?: number;
  completed_tasks?: number;
  overdue_tasks?: number;
  task_completion_rate?: number;
  invoice_payment_rate?: number;
  weekly_hours?: number;
  tasks_by_status?: Record<string, number>;
  monthly_revenue?: { month: number; revenue: number; expenses: number }[];
  expense_distribution?: ExpenseCategory[];
  recent_invoices?: RecentInvoice[];
  // Admin extra
  total_users?: number;
  total_employees?: number;
  // Accountant
  overdue_invoices?: number;
  paid_invoices?: number;
  total_salaries?: number;
  recent_transactions?: { id: number; type: string; amount: number; currency: string; category: string; description: string; date: string }[];
  // Sales
  total_leads?: number;
  new_leads?: number;
  conversion_rate?: number;
  leads_by_stage?: Record<string, number>;
  // Employee
  in_progress_tasks?: number;
  my_projects?: number;
  upcoming_tasks?: { id: number; title: string; status: string; priority: string; due_date: string | null; project: string | null }[];
}

// ========== Workflow Automation ==========
export type WorkflowTrigger = 'lead_converted' | 'contract_expiring' | 'contract_expired' | 'invoice_overdue' | 'invoice_paid' | 'task_completed';
export type WorkflowAction = 'create_invoice' | 'create_task' | 'send_notification' | 'update_status';

export interface WorkflowRule {
  id: number;
  name: string;
  trigger: WorkflowTrigger;
  conditions: Record<string, unknown> | null;
  action: WorkflowAction;
  action_config: Record<string, unknown> | null;
  is_active: boolean;
  executions_count: number;
  last_executed_at: string | null;
  created_at: string;
}

export interface WorkflowLog {
  id: number;
  workflow_rule_id: number;
  trigger: WorkflowTrigger;
  action: WorkflowAction;
  status: 'success' | 'failed';
  entity_type: string | null;
  entity_id: number | null;
  result: string | null;
  error: string | null;
  rule?: { id: number; name: string };
  created_at: string;
}

// ========== Internal Chat ==========
export interface ChatChannel {
  id: number;
  name: string;
  type: 'public' | 'private' | 'direct';
  description: string | null;
  created_by: number;
  company_id?: number;
  company?: { id: number; name: string };
  members: ChatMember[];
  latest_message: ChatMessage | null;
  unread_count: number;
  created_at: string;
}

export interface ChatMember {
  id: number;
  name: string;
  avatar: string | null;
  pivot?: { last_read_at: string | null };
}

export interface ChatMessage {
  id: number;
  channel_id: number;
  user_id: number;
  body: string;
  attachment: string | null;
  attachment_name: string | null;
  reply_to_id: number | null;
  reply_to: { id: number; body: string; user_id: number; attachment_name: string | null; user?: { id: number; name: string } } | null;
  reactions: ChatReaction[];
  user?: { id: number; name: string; avatar: string | null };
  created_at: string;
}

export interface ChatReaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  user?: { id: number; name: string };
}

export interface ChatUser {
  id: number;
  name: string;
  avatar: string | null;
  role: string;
}

// ========== Template Library ==========
export interface TemplateCategory {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  sort_order: number;
  templates_count?: number;
}

export interface SchemaField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select' | 'multi_select' | 'checkbox' | 'url';
  required?: boolean;
  default?: unknown;
  options?: string[];
  unit?: string;
  currency?: string;
}

export interface SchemaSection {
  title: string;
  fields: string[];
}

export interface TemplateSchema {
  fields: SchemaField[];
  sections: SchemaSection[];
}

export interface Template {
  id: number;
  name: string;
  description: string | null;
  category_id: number;
  category?: TemplateCategory;
  schema: TemplateSchema;
  preview_data: Record<string, unknown> | null;
  thumbnail_color: string | null;
  is_default: boolean;
  is_locked: boolean;
  usage_count: number;
  creator?: User;
  created_at: string;
}

export type UserDocumentStatus = 'draft' | 'completed' | 'archived';

export interface UserDocument {
  id: number;
  user_id: number;
  template_id: number | null;
  title: string;
  schema_snapshot: TemplateSchema;
  data: Record<string, unknown>;
  status: UserDocumentStatus;
  folder_id: number | null;
  managed_file_id: number | null;
  project_id: number | null;
  client_id: number | null;
  user?: User;
  template?: Template;
  project?: { id: number; name: string };
  client?: { id: number; name: string };
  managed_file?: { id: number; name: string; file_path: string };
  created_at: string;
  updated_at: string;
}
