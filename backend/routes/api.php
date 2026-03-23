<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\SuperAdmin\CompanyController as SuperAdminCompanyController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\SalaryPaymentController;
use App\Http\Controllers\Api\TreasuryController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\InstallmentController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\FileTemplateController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\LeadActivityController;
use App\Http\Controllers\Api\SalesController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\EmailController;
use App\Http\Controllers\Api\WorkflowController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\KpiController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\ProjectTemplateController;
use App\Http\Controllers\Api\TaskChecklistController;
use App\Http\Controllers\Api\TimeEntryController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\MediaLibraryController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\PushController;
use Illuminate\Support\Facades\Route;

// ========== Health Check (public) ==========
Route::get('/health', [HealthController::class, 'check']);

// ========== Public Routes ==========
Route::middleware('throttle:5,1')->post('/auth/login', [AuthController::class, 'login']);
Route::middleware('throttle:5,1')->post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::middleware('throttle:5,1')->post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// ========== Authenticated Routes ==========
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::post('/auth/avatar', [AuthController::class, 'updateAvatar']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ========== Super Admin Only ==========
    Route::middleware('role:super_admin')->prefix('super-admin')->group(function () {
        Route::get('/companies', [SuperAdminCompanyController::class, 'index']);
        Route::post('/companies/{company}/switch', [SuperAdminCompanyController::class, 'switch']);
    });

    // Companies CRUD (super_admin only)
    Route::middleware('role:super_admin')->group(function () {
        Route::apiResource('companies', CompanyController::class);
    });

    // ========== Clients & Contracts ==========
    Route::middleware('role:super_admin,manager,sales,employee')->group(function () {
        Route::get('clients', [ClientController::class, 'index']);
        Route::get('clients/{client}', [ClientController::class, 'show']);
    });
    Route::middleware('role:super_admin,manager,sales')->group(function () {
        Route::get('clients/financial-summary', [ClientController::class, 'financialSummary']);
        Route::post('clients', [ClientController::class, 'store']);
        Route::put('clients/{client}', [ClientController::class, 'update']);
        Route::delete('clients/{client}', [ClientController::class, 'destroy']);
        Route::post('clients/batch-delete', [ClientController::class, 'batchDelete']);
        Route::apiResource('clients.contracts', ContractController::class);
    });

    // Contracts (standalone)
    Route::middleware('role:super_admin,manager,sales,accountant')->group(function () {
        Route::apiResource('contracts', ContractController::class);
        Route::get('/contracts/{contract}/installments', [InstallmentController::class, 'index']);
        Route::post('/contracts/{contract}/installments/generate', [InstallmentController::class, 'generate']);
        Route::post('/installments/{installment}/pay', [InstallmentController::class, 'markPaid']);
    });

    // ========== Invoices & Payments ==========
    Route::middleware('role:super_admin,manager,accountant')->group(function () {
        Route::apiResource('invoices', InvoiceController::class);
        Route::post('invoices/batch-delete', [InvoiceController::class, 'batchDelete']);
        Route::post('/invoices/{invoice}/payments', [InvoiceController::class, 'recordPayment']);
        Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf']);
    });

    // ========== Quotations ==========
    Route::middleware('role:super_admin,manager,sales,accountant')->group(function () {
        Route::apiResource('quotations', QuotationController::class);
        Route::get('/quotations/{quotation}/pdf', [QuotationController::class, 'downloadPdf']);
    });

    // ========== Support Tickets ==========
    Route::apiResource('tickets', TicketController::class);
    Route::post('/tickets/{ticket}/replies', [TicketController::class, 'reply']);

    // ========== Leave Management ==========
    Route::get('/leaves', [LeaveController::class, 'index']);
    Route::post('/leaves', [LeaveController::class, 'store']);
    Route::post('/leaves/{leaveRequest}/approve', [LeaveController::class, 'approve']);
    Route::post('/leaves/{leaveRequest}/reject', [LeaveController::class, 'reject']);
    Route::delete('/leaves/{leaveRequest}', [LeaveController::class, 'destroy']);
    Route::get('/leaves/balance', [LeaveController::class, 'balance']);

    // ========== Attendance ==========
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance', [AttendanceController::class, 'store']);
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/attendance/check-out', [AttendanceController::class, 'checkOut']);
    Route::get('/attendance/today', [AttendanceController::class, 'today']);
    Route::get('/attendance/summary', [AttendanceController::class, 'summary']);

    // ========== Email ==========
    Route::middleware('role:super_admin,manager,sales,accountant')->group(function () {
        Route::post('/email/send', [EmailController::class, 'send']);
        Route::post('/email/invoice/{invoice}', [EmailController::class, 'sendInvoice']);
        Route::post('/email/quotation/{quotation}', [EmailController::class, 'sendQuotation']);
    });

    // ========== Workflow Automation ==========
    Route::middleware('role:super_admin,manager')->group(function () {
        Route::apiResource('workflows', WorkflowController::class);
        Route::post('/workflows/{workflow}/toggle', [WorkflowController::class, 'toggle']);
        Route::get('/workflow-logs', [WorkflowController::class, 'logs']);
        Route::get('/workflow-templates', [WorkflowController::class, 'templates']);
    });

    // ========== Employees & HR ==========
    Route::middleware('role:super_admin,manager,employee')->group(function () {
        Route::get('employees', [EmployeeController::class, 'index']);
        Route::get('employees/{employee}', [EmployeeController::class, 'show']);
    });
    Route::middleware('role:super_admin,manager')->group(function () {
        Route::post('employees', [EmployeeController::class, 'store']);
        Route::put('employees/{employee}', [EmployeeController::class, 'update']);
        Route::delete('employees/{employee}', [EmployeeController::class, 'destroy']);
        Route::post('/employees/{employee}/files', [EmployeeController::class, 'uploadFile']);
        Route::delete('/employees/{employee}/files/{file}', [EmployeeController::class, 'deleteFile']);
    });

    // Salary Payments
    Route::middleware('role:super_admin,manager,accountant')->group(function () {
        Route::apiResource('salary-payments', SalaryPaymentController::class)->except(['destroy']);
    });

    // ========== Treasury ==========
    Route::middleware('role:super_admin,manager,accountant')->group(function () {
        Route::get('/treasury/balance', [TreasuryController::class, 'balance']);
        Route::apiResource('treasury', TreasuryController::class)->except(['update', 'destroy']);
        Route::apiResource('expenses', ExpenseController::class);
    });

    // ========== Tasks (all authenticated) ==========
    Route::apiResource('tasks', TaskController::class);
    Route::post('tasks/batch-delete', [TaskController::class, 'batchDelete']);
    Route::post('/tasks/{task}/comments', [TaskController::class, 'addComment']);

    // Task Checklists
    Route::get('/tasks/{task}/checklists', [TaskChecklistController::class, 'index']);
    Route::post('/tasks/{task}/checklists', [TaskChecklistController::class, 'store']);
    Route::put('/tasks/{task}/checklists/{checklist}', [TaskChecklistController::class, 'update']);
    Route::delete('/tasks/{task}/checklists/{checklist}', [TaskChecklistController::class, 'destroy']);
    Route::post('/tasks/{task}/checklists/reorder', [TaskChecklistController::class, 'reorder']);

    // ========== Time Tracking ==========
    Route::get('/time-entries', [TimeEntryController::class, 'index']);
    Route::post('/time-entries', [TimeEntryController::class, 'store']);
    Route::post('/time-entries/start', [TimeEntryController::class, 'start']);
    Route::post('/time-entries/stop', [TimeEntryController::class, 'stop']);
    Route::get('/time-entries/running', [TimeEntryController::class, 'running']);
    Route::get('/time-entries/summary', [TimeEntryController::class, 'summary']);
    Route::delete('/time-entries/{timeEntry}', [TimeEntryController::class, 'destroy']);

    // ========== Calendar ==========
    Route::get('/calendar', [CalendarController::class, 'index']);

    // ========== Announcements ==========
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::get('/announcements/unread-count', [AnnouncementController::class, 'unreadCount']);
    Route::post('/announcements/mark-read', [AnnouncementController::class, 'markRead']);
    Route::post('/announcements/{announcement}/toggle-like', [AnnouncementController::class, 'toggleLike']);
    Route::middleware('role:super_admin')->group(function () {
        Route::post('/announcements', [AnnouncementController::class, 'store']);
        Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update']);
        Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);
    });

    // ========== Meetings ==========
    Route::apiResource('meetings', MeetingController::class);
    Route::post('/meetings/{meeting}/respond', [MeetingController::class, 'respond']);

    // ========== Media Library ==========
    Route::get('/media', [MediaLibraryController::class, 'index']);

    // ========== Projects ==========
    Route::apiResource('projects', ProjectController::class);
    Route::post('/projects/{project}/files', [ProjectController::class, 'uploadFile']);
    Route::delete('/projects/{project}/files/{file}', [ProjectController::class, 'deleteFile']);
    Route::get('/projects/{project}/client-profile', [ProjectController::class, 'clientProfile']);

    // ========== Employee Reports ==========
    Route::get('/reports/employees', [ProjectController::class, 'employeeReport']);

    // ========== Partners ==========
    Route::middleware('role:super_admin,manager')->group(function () {
        Route::get('/partners/profits', [PartnerController::class, 'profits']);
        Route::get('/partners/monthly-profit', [PartnerController::class, 'monthlyProfit']);
        Route::get('/partners/{partner}/statement', [PartnerController::class, 'statement']);
        Route::get('/partners/{partner}/payments', [PartnerController::class, 'payments']);
        Route::post('/partners/{partner}/payments', [PartnerController::class, 'recordPayment']);
        Route::delete('/partners/{partner}/payments/{payment}', [PartnerController::class, 'deletePayment']);
        Route::apiResource('partners', PartnerController::class)->only(['index', 'store', 'update', 'destroy']);
    });

    // ========== Users ==========
    Route::middleware('role:super_admin,manager')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
        Route::get('/permissions/all', [UserController::class, 'allPermissions']);
        Route::get('/permissions/defaults/{role}', [UserController::class, 'defaultPermissions']);
    });

    // ========== Reports ==========
    Route::middleware('role:super_admin,manager,accountant')->group(function () {
        Route::get('/reports/monthly', [ReportController::class, 'monthly']);
        Route::get('/reports/yearly', [ReportController::class, 'yearly']);
        Route::get('/reports/clients', [ReportController::class, 'clients']);
        Route::get('/reports/salaries', [ReportController::class, 'salaries']);
        Route::get('/reports/treasury', [ReportController::class, 'treasury']);
        Route::get('/reports/partners', [ReportController::class, 'partners']);
        Route::get('/reports/profit-loss', [ReportController::class, 'profitLoss']);
        Route::get('/reports/cash-flow', [ReportController::class, 'cashFlow']);
        Route::get('/reports/export-pdf', [ReportController::class, 'exportPdf']);
        Route::get('/reports/kpi', [ReportController::class, 'kpiReport']);
    });

    // ========== Notifications ==========
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // ========== File Templates ==========
    Route::middleware('role:super_admin,manager')->group(function () {
        Route::apiResource('file-templates', FileTemplateController::class)->except(['show']);
    });

    // ========== Sales Pipeline ==========
    Route::middleware('role:super_admin,manager,sales')->group(function () {
        Route::get('/sales/dashboard', [SalesController::class, 'dashboard']);
        Route::get('/sales/report', [SalesController::class, 'report']);
        Route::post('/leads/import', [LeadController::class, 'import']);
        Route::get('/leads/import-template', [LeadController::class, 'importTemplate']);
        Route::post('/leads/{lead}/stage', [LeadController::class, 'updateStage']);
        Route::post('/leads/{lead}/convert', [LeadController::class, 'convertToClient']);
        Route::apiResource('leads', LeadController::class);
        Route::get('/leads/{lead}/activities', [LeadActivityController::class, 'index']);
        Route::post('/leads/{lead}/activities', [LeadActivityController::class, 'store']);
    });

    // ========== Activity Log ==========
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    // ========== Internal Chat ==========
    Route::get('/chat/channels', [ChatController::class, 'channels']);
    Route::post('/chat/channels', [ChatController::class, 'createChannel']);
    Route::put('/chat/channels/{channel}', [ChatController::class, 'updateChannel']);
    Route::delete('/chat/channels/{channel}', [ChatController::class, 'deleteChannel']);
    Route::post('/chat/channels/{channel}/members', [ChatController::class, 'addMembers']);
    Route::delete('/chat/channels/{channel}/members/{user}', [ChatController::class, 'removeMember']);
    Route::get('/chat/channels/{channel}/messages', [ChatController::class, 'messages']);
    Route::post('/chat/channels/{channel}/messages', [ChatController::class, 'sendMessage']);
    Route::delete('/chat/channels/{channel}/messages/{message}', [ChatController::class, 'deleteMessage']);
    Route::post('/chat/channels/{channel}/read', [ChatController::class, 'markRead']);
    Route::get('/chat/users', [ChatController::class, 'users']);

    // ========== KPI Dashboard ==========
    Route::get('/kpi/personal', [KpiController::class, 'personal']);
    Route::middleware('role:super_admin,manager')->get('/kpi/team', [KpiController::class, 'team']);

    // ========== Tags ==========
    Route::apiResource('tags', TagController::class)->except(['show']);
    Route::post('/tags/attach', [TagController::class, 'attach']);
    Route::post('/tags/detach', [TagController::class, 'detach']);

    // ========== Project Templates ==========
    Route::middleware('role:super_admin,manager')->group(function () {
        Route::apiResource('project-templates', ProjectTemplateController::class)->except(['show']);
        Route::post('/project-templates/{projectTemplate}/apply', [ProjectTemplateController::class, 'apply']);
    });

    // ========== System Monitoring ==========
    Route::middleware('role:super_admin')->get('/system/status', [HealthController::class, 'systemStatus']);

    // ========== Push Notifications ==========
    Route::post('/push/subscribe', [PushController::class, 'subscribe']);
    Route::post('/push/unsubscribe', [PushController::class, 'unsubscribe']);
});
