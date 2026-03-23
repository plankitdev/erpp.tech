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
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceForm = lazy(() => import('./pages/InvoiceForm'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeForm = lazy(() => import('./pages/EmployeeForm'));
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'));
const Salaries = lazy(() => import('./pages/Salaries'));
const Treasury = lazy(() => import('./pages/Treasury'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Tasks = lazy(() => import('./pages/Tasks'));
const TaskBoard = lazy(() => import('./pages/TaskBoard'));
const Partners = lazy(() => import('./pages/Partners'));
const PartnerStatement = lazy(() => import('./pages/PartnerStatement'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
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
const MediaLibrary = lazy(() => import('./pages/MediaLibrary'));
const ClientsHub = lazy(() => import('./pages/ClientsHub'));
const TasksHub = lazy(() => import('./pages/TasksHub'));
const FinanceHub = lazy(() => import('./pages/FinanceHub'));
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
const Announcements = lazy(() => import('./pages/Announcements'));
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
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="chat" element={<Chat />} />
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
        <Route path="invoices" element={<RoleGuard permission="invoices"><Invoices /></RoleGuard>} />
        <Route path="invoices/create" element={<RoleGuard permission="invoices"><InvoiceForm /></RoleGuard>} />
        <Route path="invoices/:id" element={<RoleGuard permission="invoices"><InvoiceDetail /></RoleGuard>} />
        <Route path="invoices/:id/edit" element={<RoleGuard permission="invoices"><InvoiceForm /></RoleGuard>} />
        <Route path="sales-hub" element={<RoleGuard permission="sales"><SalesHub /></RoleGuard>} />
        <Route path="sales" element={<RoleGuard permission="sales"><SalesDashboard /></RoleGuard>} />
        <Route path="leads" element={<RoleGuard permission="sales"><LeadsPage /></RoleGuard>} />
        <Route path="leads/:id" element={<RoleGuard permission="sales"><LeadDetailPage /></RoleGuard>} />
        <Route path="quotations" element={<RoleGuard permission="sales"><Quotations /></RoleGuard>} />
        <Route path="tickets" element={<RoleGuard permission="clients"><Tickets /></RoleGuard>} />
        <Route path="email" element={<RoleGuard permission="sales"><EmailCompose /></RoleGuard>} />

        {/* المهام والمشاريع */}
        <Route path="tasks-hub" element={<RoleGuard permission="tasks"><TasksHub /></RoleGuard>} />
        <Route path="projects" element={<RoleGuard permission="tasks"><Projects /></RoleGuard>} />
        <Route path="projects/:slug" element={<RoleGuard permission="tasks"><ProjectDetail /></RoleGuard>} />
        <Route path="tasks" element={<RoleGuard permission="tasks"><Tasks /></RoleGuard>} />
        <Route path="tasks/board" element={<RoleGuard permission="tasks"><TaskBoard /></RoleGuard>} />
        <Route path="tasks/:id" element={<RoleGuard permission="tasks"><TaskDetail /></RoleGuard>} />
        <Route path="calendar" element={<RoleGuard permission="tasks"><CalendarPage /></RoleGuard>} />
        <Route path="time-tracking" element={<RoleGuard permission="tasks"><TimeTracking /></RoleGuard>} />
        <Route path="meetings" element={<RoleGuard permission="tasks"><Meetings /></RoleGuard>} />
        <Route path="gantt" element={<RoleGuard permission="tasks"><GanttChart /></RoleGuard>} />

        {/* المالية */}
        <Route path="finance-hub" element={<RoleGuard permission="treasury"><FinanceHub /></RoleGuard>} />
        <Route path="treasury" element={<RoleGuard permission="treasury"><Treasury /></RoleGuard>} />
        <Route path="expenses" element={<RoleGuard permission="expenses"><Expenses /></RoleGuard>} />
        <Route path="partners" element={<RoleGuard permission="partners"><Partners /></RoleGuard>} />
        <Route path="partners/:id/statement" element={<RoleGuard permission="partners"><PartnerStatement /></RoleGuard>} />

        {/* الموارد البشرية */}
        <Route path="hr-hub" element={<RoleGuard permission="employees"><HRHub /></RoleGuard>} />
        <Route path="employees" element={<RoleGuard permission="employees"><Employees /></RoleGuard>} />
        <Route path="employees/create" element={<RoleGuard permission="employees"><EmployeeForm /></RoleGuard>} />
        <Route path="employees/:id" element={<RoleGuard permission="employees"><EmployeeProfile /></RoleGuard>} />
        <Route path="employees/:id/edit" element={<RoleGuard permission="employees"><EmployeeForm /></RoleGuard>} />
        <Route path="salaries" element={<RoleGuard permission="salaries"><Salaries /></RoleGuard>} />
        <Route path="leave-attendance" element={<RoleGuard permission="employees"><LeaveAttendance /></RoleGuard>} />

        {/* النظام والإدارة */}
        <Route path="reports" element={<RoleGuard permission="reports"><Reports /></RoleGuard>} />
        <Route path="reports/employees" element={<RoleGuard permission="reports"><EmployeeReports /></RoleGuard>} />
        <Route path="users" element={<RoleGuard permission="users"><Users /></RoleGuard>} />
        <Route path="activity-logs" element={<RoleGuard permission="activity_logs"><ActivityLogs /></RoleGuard>} />
        <Route path="media" element={<RoleGuard permission="settings"><MediaLibrary /></RoleGuard>} />
        <Route path="file-templates" element={<RoleGuard permission="settings"><FileTemplates /></RoleGuard>} />
        <Route path="settings" element={<RoleGuard permission="settings"><Settings /></RoleGuard>} />
        <Route path="workflows" element={<RoleGuard permission="settings"><WorkflowAutomation /></RoleGuard>} />
        <Route path="tags" element={<RoleGuard permission="settings"><TagsManager /></RoleGuard>} />
        <Route path="api-docs" element={<RoleGuard permission="settings"><ApiDocs /></RoleGuard>} />
        <Route path="system-monitor" element={<RoleGuard permission="settings"><SystemMonitor /></RoleGuard>} />

        {/* صفحة غير موجودة */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}
