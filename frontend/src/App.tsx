import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import Layout from './components/Layout';
import RoleGuard from './components/RoleGuard';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';

const Login = lazy(() => import('./pages/Login'));
const SelectCompany = lazy(() => import('./pages/SelectCompany'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientForm = lazy(() => import('./pages/ClientForm'));
const ClientProfile = lazy(() => import('./pages/ClientProfile'));
const ClientsFinancial = lazy(() => import('./pages/ClientsFinancial'));
const Contracts = lazy(() => import('./pages/Contracts'));
const ContractForm = lazy(() => import('./pages/ContractForm'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeForm = lazy(() => import('./pages/EmployeeForm'));
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'));
const Salaries = lazy(() => import('./pages/Salaries'));
const Tasks = lazy(() => import('./pages/Tasks'));
const TaskBoard = lazy(() => import('./pages/TaskBoard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ProjectChat = lazy(() => import('./pages/ProjectChat'));
const ProjectClient = lazy(() => import('./pages/ProjectClient'));
const Backlog = lazy(() => import('./pages/Backlog'));
const MyTasks = lazy(() => import('./pages/MyTasks'));
const EmployeeReports = lazy(() => import('./pages/EmployeeReports'));
const FileTemplates = lazy(() => import('./pages/FileTemplates'));
const Reports = lazy(() => import('./pages/Reports'));
const Users = lazy(() => import('./pages/Users'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Installments = lazy(() => import('./pages/Installments'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const LeadsPage = lazy(() => import('./pages/LeadsPage'));
const LeadDetailPage = lazy(() => import('./pages/LeadDetailPage'));
const SalesDashboard = lazy(() => import('./pages/SalesDashboard'));
const TaskDetail = lazy(() => import('./pages/TaskDetail'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const Meetings = lazy(() => import('./pages/Meetings'));
const MeetingForm = lazy(() => import('./pages/MeetingForm'));
const MediaLibrary = lazy(() => import('./pages/MediaLibrary'));
const ClientsHub = lazy(() => import('./pages/ClientsHub'));
const TasksHub = lazy(() => import('./pages/TasksHub'));
const AccountManagerHub = lazy(() => import('./pages/AccountManagerHub'));
const WeeklyReport = lazy(() => import('./pages/WeeklyReport'));
const ClientProgressReport = lazy(() => import('./pages/ClientProgressReport'));
const HRHub = lazy(() => import('./pages/HRHub'));
const SalesHub = lazy(() => import('./pages/SalesHub'));
const TimeTracking = lazy(() => import('./pages/TimeTracking'));
const Quotations = lazy(() => import('./pages/Quotations'));
const Tickets = lazy(() => import('./pages/Tickets'));
const LeaveAttendance = lazy(() => import('./pages/LeaveAttendance'));
const GanttChart = lazy(() => import('./pages/GanttChart'));
const EmailCompose = lazy(() => import('./pages/EmailCompose'));
const WorkflowAutomation = lazy(() => import('./pages/WorkflowAutomation'));
const ApiDocs = lazy(() => import('./pages/ApiDocs'));
const Chat = lazy(() => import('./pages/Chat'));
const KpiDashboard = lazy(() => import('./pages/KpiDashboard'));
const TagsManager = lazy(() => import('./pages/TagsManager'));
const SystemMonitor = lazy(() => import('./pages/SystemMonitor'));
const FileManagerPage = lazy(() => import('./pages/FileManager'));
const GoogleDriveCallback = lazy(() => import('./pages/GoogleDriveCallback'));
const Announcements = lazy(() => import('./pages/Announcements'));
const PersonalTodos = lazy(() => import('./pages/PersonalTodos'));
const MyDay = lazy(() => import('./pages/MyDay'));
const AgencyModules = lazy(() => import('./pages/AgencyModules'));
const FinanceHub = lazy(() => import('./pages/FinanceHub'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceForm = lazy(() => import('./pages/InvoiceForm'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const Treasury = lazy(() => import('./pages/Treasury'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Partners = lazy(() => import('./pages/Partners'));
const PartnerStatement = lazy(() => import('./pages/PartnerStatement'));
const ChartOfAccounts = lazy(() => import('./pages/ChartOfAccounts'));
const JournalEntries = lazy(() => import('./pages/JournalEntries'));
const CostCenters = lazy(() => import('./pages/CostCenters'));
const Budgets = lazy(() => import('./pages/Budgets'));
const BankAccounts = lazy(() => import('./pages/BankAccounts'));
const FixedAssets = lazy(() => import('./pages/FixedAssets'));
const AccountsReceivable = lazy(() => import('./pages/AccountsReceivable'));
const BalanceSheet = lazy(() => import('./pages/BalanceSheet'));
const FinancialKPIs = lazy(() => import('./pages/FinancialKPIs'));
// const TemplateLibrary = lazy(() => import('./pages/TemplateLibrary'));
// const DocumentEditor = lazy(() => import('./pages/DocumentEditor'));
// const MyDocuments = lazy(() => import('./pages/MyDocuments'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  if (loading) return <PageLoader message="جاري تحميل البيانات..." />;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'super_admin' && !user.company) return <Navigate to="/select-company" />;
  return <>{children}</>;
}

export default function App() {
  useSessionTimeout();

  return (
    <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/select-company" element={<SelectCompany />} />
      <Route path="/google-drive/callback" element={<GoogleDriveCallback />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="my-day" element={<MyDay />} />
        <Route path="agency-modules" element={<RoleGuard roles={['super_admin']}><AgencyModules /></RoleGuard>} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="chat" element={<Chat />} />
        <Route path="personal-todos" element={<PersonalTodos />} />
        <Route path="kpi" element={<KpiDashboard />} />
        <Route path="notifications" element={<Notifications />} />

        {/* العملاء والمبيعات */}
        <Route path="clients-hub" element={<RoleGuard permission="clients"><ClientsHub /></RoleGuard>} />
        <Route path="clients" element={<RoleGuard permission="clients"><Clients /></RoleGuard>} />
        <Route path="clients/financial" element={<RoleGuard permission="clients"><ClientsFinancial /></RoleGuard>} />
        <Route path="clients/create" element={<RoleGuard permission="clients"><ClientForm /></RoleGuard>} />
        <Route path="clients/:id" element={<RoleGuard permission="clients"><ClientProfile /></RoleGuard>} />
        <Route path="clients/:id/edit" element={<RoleGuard permission="clients"><ClientForm /></RoleGuard>} />
        <Route path="contracts" element={<RoleGuard permission="contracts"><Contracts /></RoleGuard>} />
        <Route path="contracts/create" element={<RoleGuard permission="contracts"><ContractForm /></RoleGuard>} />
        <Route path="contracts/:id/edit" element={<RoleGuard permission="contracts"><ContractForm /></RoleGuard>} />
        <Route path="contracts/:id/installments" element={<RoleGuard permission="contracts"><Installments /></RoleGuard>} />
        <Route path="sales-hub" element={<RoleGuard permission="sales"><SalesHub /></RoleGuard>} />
        <Route path="sales" element={<RoleGuard permission="sales"><SalesDashboard /></RoleGuard>} />
        <Route path="leads" element={<RoleGuard permission="sales"><LeadsPage /></RoleGuard>} />
        <Route path="leads/:id" element={<RoleGuard permission="sales"><LeadDetailPage /></RoleGuard>} />
        <Route path="quotations" element={<RoleGuard permission="sales"><Quotations /></RoleGuard>} />
        <Route path="tickets" element={<RoleGuard permission="clients"><Tickets /></RoleGuard>} />
        <Route path="email" element={<RoleGuard permission="sales"><EmailCompose /></RoleGuard>} />

        {/* المهام والمشاريع */}
        <Route path="tasks-hub" element={<RoleGuard permission="tasks"><TasksHub /></RoleGuard>} />
        <Route path="account-manager" element={<RoleGuard permission="tasks" roles={['super_admin', 'company_admin', 'manager', 'marketing_manager']}><AccountManagerHub /></RoleGuard>} />
        <Route path="weekly-report" element={<RoleGuard permission="tasks" roles={['super_admin', 'company_admin', 'manager', 'marketing_manager']}><WeeklyReport /></RoleGuard>} />
        <Route path="client-report" element={<RoleGuard permission="tasks" roles={['super_admin', 'company_admin', 'manager', 'marketing_manager']}><ClientProgressReport /></RoleGuard>} />
        <Route path="projects" element={<RoleGuard permission="projects"><Projects /></RoleGuard>} />
        <Route path="projects/:slug" element={<RoleGuard permission="projects"><ProjectDetail /></RoleGuard>} />
        <Route path="projects/:slug/chat" element={<RoleGuard permission="projects"><ProjectChat /></RoleGuard>} />
        <Route path="projects/:slug/client" element={<RoleGuard permission="projects"><ProjectClient /></RoleGuard>} />
        <Route path="projects/:slug/backlog" element={<RoleGuard permission="projects"><Backlog /></RoleGuard>} />
        <Route path="tasks" element={<RoleGuard permission="tasks"><Tasks /></RoleGuard>} />
        <Route path="tasks/board" element={<RoleGuard permission="tasks"><TaskBoard /></RoleGuard>} />
        <Route path="my-tasks" element={<RoleGuard permission="tasks"><MyTasks /></RoleGuard>} />
        <Route path="tasks/:id" element={<RoleGuard permission="tasks"><TaskDetail /></RoleGuard>} />
        <Route path="calendar" element={<RoleGuard permission="tasks"><CalendarPage /></RoleGuard>} />
        <Route path="time-tracking" element={<RoleGuard permission="tasks"><TimeTracking /></RoleGuard>} />
        <Route path="meetings" element={<RoleGuard permission="tasks"><Meetings /></RoleGuard>} />
        <Route path="meetings/create" element={<RoleGuard permission="tasks"><MeetingForm /></RoleGuard>} />
        <Route path="meetings/:id/edit" element={<RoleGuard permission="tasks"><MeetingForm /></RoleGuard>} />
        <Route path="gantt" element={<RoleGuard permission="tasks"><GanttChart /></RoleGuard>} />

        {/* الموارد البشرية */}
        <Route path="hr-hub" element={<RoleGuard permission="employees"><HRHub /></RoleGuard>} />
        <Route path="employees" element={<RoleGuard permission="employees"><Employees /></RoleGuard>} />
        <Route path="employees/create" element={<RoleGuard permission="employees"><EmployeeForm /></RoleGuard>} />
        <Route path="employees/:id" element={<RoleGuard permission="employees"><EmployeeProfile /></RoleGuard>} />
        <Route path="employees/:id/edit" element={<RoleGuard permission="employees"><EmployeeForm /></RoleGuard>} />
        <Route path="salaries" element={<RoleGuard permission="salaries"><Salaries /></RoleGuard>} />
        <Route path="leave-attendance" element={<LeaveAttendance />} />

        {/* المالية */}
        <Route path="finance-hub" element={<RoleGuard permission="treasury"><FinanceHub /></RoleGuard>} />
        <Route path="invoices" element={<RoleGuard permission="invoices"><Invoices /></RoleGuard>} />
        <Route path="invoices/create" element={<RoleGuard permission="invoices"><InvoiceForm /></RoleGuard>} />
        <Route path="invoices/:id" element={<RoleGuard permission="invoices"><InvoiceDetail /></RoleGuard>} />
        <Route path="invoices/:id/edit" element={<RoleGuard permission="invoices"><InvoiceForm /></RoleGuard>} />
        <Route path="treasury" element={<RoleGuard permission="treasury"><Treasury /></RoleGuard>} />
        <Route path="treasury/create" element={<RoleGuard permission="treasury"><Treasury /></RoleGuard>} />
        <Route path="expenses" element={<RoleGuard permission="expenses"><Expenses /></RoleGuard>} />
        <Route path="expenses/create" element={<RoleGuard permission="expenses"><Expenses /></RoleGuard>} />
        <Route path="partners" element={<RoleGuard permission="treasury"><Partners /></RoleGuard>} />
        <Route path="partners/:id/statement" element={<RoleGuard permission="treasury"><PartnerStatement /></RoleGuard>} />

        {/* المحاسبة المتقدمة */}
        <Route path="chart-of-accounts" element={<RoleGuard roles={['super_admin', 'company_admin', 'manager', 'accountant']}><ChartOfAccounts /></RoleGuard>} />
        <Route path="journal-entries" element={<RoleGuard roles={['super_admin', 'company_admin', 'manager', 'accountant']}><JournalEntries /></RoleGuard>} />
        <Route path="cost-centers" element={<RoleGuard roles={['super_admin', 'company_admin', 'manager', 'accountant']}><CostCenters /></RoleGuard>} />
        <Route path="budgets" element={<RoleGuard roles={['super_admin', 'company_admin', 'manager', 'accountant']}><Budgets /></RoleGuard>} />
        <Route path="bank-accounts" element={<RoleGuard roles={['super_admin', 'company_admin', 'manager', 'accountant']}><BankAccounts /></RoleGuard>} />
        <Route path="fixed-assets" element={<RoleGuard roles={['super_admin', 'company_admin', 'manager', 'accountant']}><FixedAssets /></RoleGuard>} />
        <Route path="accounts-receivable" element={<RoleGuard roles={['super_admin', 'company_admin', 'manager', 'accountant']}><AccountsReceivable /></RoleGuard>} />
        <Route path="balance-sheet" element={<RoleGuard roles={['super_admin', 'company_admin', 'manager', 'accountant']}><BalanceSheet /></RoleGuard>} />
        <Route path="financial-kpis" element={<RoleGuard roles={['super_admin', 'company_admin', 'manager', 'accountant']}><FinancialKPIs /></RoleGuard>} />

        {/* النظام والإدارة */}
        <Route path="reports" element={<RoleGuard permission="reports"><Reports /></RoleGuard>} />
        <Route path="reports/employees" element={<RoleGuard permission="reports"><EmployeeReports /></RoleGuard>} />
        <Route path="users" element={<RoleGuard permission="users" roles={['super_admin', 'company_admin', 'manager']}><Users /></RoleGuard>} />
        <Route path="activity-logs" element={<RoleGuard permission="activity_logs" roles={['super_admin', 'company_admin', 'manager']}><ActivityLogs /></RoleGuard>} />
        <Route path="media" element={<RoleGuard permission="users" roles={['super_admin', 'company_admin', 'manager']}><MediaLibrary /></RoleGuard>} />
        <Route path="file-manager" element={<FileManagerPage />} />
        <Route path="file-manager/folder/:folderId" element={<FileManagerPage />} />
        <Route path="file-templates" element={<RoleGuard permission="users" roles={['super_admin', 'company_admin', 'manager']}><FileTemplates /></RoleGuard>} />
        {/* <Route path="template-library" element={<TemplateLibrary />} /> */}
        {/* <Route path="my-documents" element={<MyDocuments />} /> */}
        {/* <Route path="documents/:id/edit" element={<DocumentEditor />} /> */}
        <Route path="settings" element={<Settings />} />
        <Route path="workflows" element={<RoleGuard permission="users" roles={['super_admin', 'company_admin', 'manager']}><WorkflowAutomation /></RoleGuard>} />
        <Route path="tags" element={<RoleGuard permission="users" roles={['super_admin', 'company_admin', 'manager']}><TagsManager /></RoleGuard>} />
        <Route path="api-docs" element={<RoleGuard permission="users" roles={['super_admin', 'company_admin', 'manager']}><ApiDocs /></RoleGuard>} />
        <Route path="system-monitor" element={<RoleGuard permission="users" roles={['super_admin']}><SystemMonitor /></RoleGuard>} />

        {/* صفحة غير موجودة */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}
