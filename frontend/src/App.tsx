import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';

const Login = lazy(() => import('./pages/Login'));
const SelectCompany = lazy(() => import('./pages/SelectCompany'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientForm = lazy(() => import('./pages/ClientForm'));
const ClientProfile = lazy(() => import('./pages/ClientProfile'));
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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  if (loading) return <PageLoader message="جاري تحميل البيانات..." />;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'super_admin' && !user.company) return <Navigate to="/select-company" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/select-company" element={<SelectCompany />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="clients-hub" element={<ClientsHub />} />
        <Route path="tasks-hub" element={<TasksHub />} />
        <Route path="finance-hub" element={<FinanceHub />} />
        <Route path="hr-hub" element={<HRHub />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/create" element={<ClientForm />} />
        <Route path="clients/:id" element={<ClientProfile />} />
        <Route path="clients/:id/edit" element={<ClientForm />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="contracts/create" element={<ContractForm />} />
        <Route path="contracts/:id/edit" element={<ContractForm />} />
        <Route path="contracts/:id/installments" element={<Installments />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/create" element={<InvoiceForm />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="invoices/:id/edit" element={<InvoiceForm />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/create" element={<EmployeeForm />} />
        <Route path="employees/:id" element={<EmployeeProfile />} />
        <Route path="employees/:id/edit" element={<EmployeeForm />} />
        <Route path="salaries" element={<Salaries />} />
        <Route path="treasury" element={<Treasury />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/board" element={<TaskBoard />} />
        <Route path="tasks/:id" element={<TaskDetail />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="partners" element={<Partners />} />
        <Route path="partners/:id/statement" element={<PartnerStatement />} />
        <Route path="sales" element={<SalesDashboard />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/employees" element={<EmployeeReports />} />
        <Route path="file-templates" element={<FileTemplates />} />
        <Route path="users" element={<Users />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
      </Route>
    </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}
