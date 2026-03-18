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
use App\Http\Controllers\Api\TaskChecklistController;
use App\Http\Controllers\Api\TimeEntryController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\MediaLibraryController;
use Illuminate\Support\Facades\Route;

// ========== Public Routes ==========
Route::middleware('throttle:5,1')->post('/auth/login', [AuthController::class, 'login']);

// ========== Authenticated Routes ==========
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

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
    Route::middleware('role:super_admin,manager,sales')->group(function () {
        Route::apiResource('clients', ClientController::class);
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
        Route::post('/invoices/{invoice}/payments', [InvoiceController::class, 'recordPayment']);
        Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf']);
    });

    // ========== Employees & HR ==========
    Route::middleware('role:super_admin,manager')->group(function () {
        Route::apiResource('employees', EmployeeController::class);
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
});
