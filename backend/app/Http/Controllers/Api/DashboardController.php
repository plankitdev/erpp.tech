<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Contract;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Meeting;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use App\Models\TreasuryTransaction;
use App\Models\SalaryPayment;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->role;
        $year = $request->input('year', now()->year);
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $common = $this->getCommonData();

        $roleData = match ($role) {
            'super_admin' => $this->getSuperAdminData($year, $dateFrom, $dateTo),
            'manager' => $this->getManagerData($year, $dateFrom, $dateTo),
            'accountant' => $this->getAccountantData($year, $dateFrom, $dateTo),
            'sales' => $this->getSalesData($dateFrom, $dateTo),
            'employee' => $this->getEmployeeData($user->id),
            default => [],
        };

        return $this->successResponse(array_merge($common, $roleData, ['role' => $role]));
    }

    /**
     * Sidebar badge counts: new tasks assigned, upcoming meetings, new projects.
     */
    public function badges(Request $request): JsonResponse
    {
        $user = $request->user();
        $userId = $user->id;

        // New tasks assigned to user in last 7 days that are not done
        $newTasks = Task::where(function ($q) use ($userId) {
            $q->where('assigned_to', $userId)
              ->orWhereHas('assignees', fn($q2) => $q2->where('user_id', $userId));
        })
            ->whereIn('status', ['todo', 'in_progress'])
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        // Upcoming meetings (scheduled, starting within next 7 days)
        $upcomingMeetings = Meeting::where('status', 'scheduled')
            ->where('start_time', '>=', now())
            ->where('start_time', '<=', now()->addDays(7))
            ->where(function ($q) use ($userId) {
                $q->where('created_by', $userId)
                  ->orWhereHas('participants', fn($q2) => $q2->where('user_id', $userId));
            })
            ->count();

        // New projects created in last 7 days
        $newProjects = Project::where('status', 'active')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        return $this->successResponse([
            'new_tasks' => $newTasks,
            'upcoming_meetings' => $upcomingMeetings,
            'new_projects' => $newProjects,
        ]);
    }

    private function getCommonData(): array
    {
        $recentTasks = Task::with('assignedUser')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'assigned_to_name' => $t->assignedUser?->name,
                'status' => $t->status,
                'priority' => $t->priority,
                'due_date' => $t->due_date?->format('Y-m-d'),
            ]);

        $upcomingMeetings = Meeting::with(['creator', 'participants'])
            ->where('start_time', '>=', now())
            ->where('status', 'scheduled')
            ->orderBy('start_time')
            ->limit(5)
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'start_time' => $m->start_time->format('Y-m-d H:i'),
                'type' => $m->type,
                'participants_count' => $m->participants->count(),
            ]);

        return [
            'recent_tasks' => $recentTasks,
            'upcoming_meetings' => $upcomingMeetings,
        ];
    }

    private function getSuperAdminData(int $year, ?string $dateFrom, ?string $dateTo): array
    {
        $data = $this->getManagerData($year, $dateFrom, $dateTo);
        $data['total_users'] = User::count();
        $data['total_employees'] = Employee::count();
        return $data;
    }

    private function getManagerData(int $year, ?string $dateFrom, ?string $dateTo): array
    {
        $revQ = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)->where('currency', 'EGP');
        $expQ = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)->where('currency', 'EGP');

        if ($dateFrom && $dateTo) {
            $revQ->whereBetween('date', [$dateFrom, $dateTo]);
            $expQ->whereBetween('date', [$dateFrom, $dateTo]);
        }

        $totalRevenue = $revQ->sum('amount');
        $totalExpenses = $expQ->sum('amount');

        $totalTasks = Task::count();
        $completedTasks = Task::where('status', Task::STATUS_DONE)->count();
        $overdueTasks = Task::where('due_date', '<', now())->whereNot('status', Task::STATUS_DONE)->count();

        $totalProjects = Project::count();
        $activeProjects = Project::where('status', Project::STATUS_ACTIVE)->count();

        // Task completion rate
        $taskCompletionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

        // Invoice payment rate
        $totalInvoices = Invoice::count();
        $paidInvoices = Invoice::where('status', Invoice::STATUS_PAID)->count();
        $invoicePaymentRate = $totalInvoices > 0 ? round(($paidInvoices / $totalInvoices) * 100, 1) : 0;

        // Monthly revenue chart
        $monthlyRevenue = [];
        for ($i = 1; $i <= 12; $i++) {
            $rev = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)
                ->where('currency', 'EGP')
                ->whereMonth('date', $i)->whereYear('date', $year)->sum('amount');
            $exp = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)
                ->where('currency', 'EGP')
                ->whereMonth('date', $i)->whereYear('date', $year)->sum('amount');
            $monthlyRevenue[] = ['month' => $i, 'revenue' => $rev, 'expenses' => $exp];
        }

        // Weekly time tracking
        $weeklyHours = TimeEntry::whereBetween('started_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->sum('duration_minutes');

        // Task status distribution
        $tasksByStatus = [
            'todo' => Task::where('status', Task::STATUS_TODO)->count(),
            'in_progress' => Task::where('status', Task::STATUS_IN_PROGRESS)->count(),
            'review' => Task::where('status', Task::STATUS_REVIEW)->count(),
            'done' => $completedTasks,
        ];

        // Expense distribution
        $expDist = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)
            ->where('currency', 'EGP')
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->get()
            ->map(fn($e) => [
                'name' => match($e->category) {
                    TreasuryTransaction::CATEGORY_SALARIES => 'رواتب',
                    TreasuryTransaction::CATEGORY_CLIENT_EXPENSE => 'مصروفات عملاء',
                    TreasuryTransaction::CATEGORY_REVENUE => 'إيرادات',
                    default => 'أخرى',
                },
                'value' => $e->total
            ]);

        $recentInvoices = Invoice::with('contract.client')
            ->orderByDesc('created_at')->limit(5)->get()
            ->map(fn($inv) => [
                'id' => $inv->id,
                'client_name' => $inv->contract?->client?->name,
                'amount' => $inv->amount,
                'currency' => $inv->currency,
                'due_date' => $inv->due_date?->format('Y-m-d'),
                'status' => $inv->status,
            ]);

        // Project progress for active projects
        $projectProgress = Project::where('status', Project::STATUS_ACTIVE)
            ->withCount(['tasks', 'tasks as completed_tasks_count' => fn($q) => $q->where('status', Task::STATUS_DONE)])
            ->limit(10)->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
                'total_tasks' => $p->tasks_count,
                'completed_tasks' => $p->completed_tasks_count,
                'progress' => $p->tasks_count > 0 ? round(($p->completed_tasks_count / $p->tasks_count) * 100) : 0,
                'end_date' => $p->end_date,
            ]);

        return [
            'clients_count' => Client::count(),
            'active_contracts' => Contract::where('status', Contract::STATUS_ACTIVE)->count(),
            'pending_invoices' => Invoice::whereIn('status', [Invoice::STATUS_PENDING, Invoice::STATUS_OVERDUE])->count(),
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_profit' => $totalRevenue - $totalExpenses,
            'total_projects' => $totalProjects,
            'active_projects' => $activeProjects,
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'overdue_tasks' => $overdueTasks,
            'task_completion_rate' => $taskCompletionRate,
            'invoice_payment_rate' => $invoicePaymentRate,
            'weekly_hours' => round($weeklyHours / 60, 1),
            'tasks_by_status' => $tasksByStatus,
            'monthly_revenue' => $monthlyRevenue,
            'expense_distribution' => $expDist,
            'recent_invoices' => $recentInvoices,
            'project_progress' => $projectProgress,
        ];
    }

    private function getAccountantData(int $year, ?string $dateFrom, ?string $dateTo): array
    {
        $revQ = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)->where('currency', 'EGP');
        $expQ = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)->where('currency', 'EGP');

        if ($dateFrom && $dateTo) {
            $revQ->whereBetween('date', [$dateFrom, $dateTo]);
            $expQ->whereBetween('date', [$dateFrom, $dateTo]);
        }

        $totalRevenue = $revQ->sum('amount');
        $totalExpenses = $expQ->sum('amount');

        $monthlyRevenue = [];
        for ($i = 1; $i <= 12; $i++) {
            $rev = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)
                ->where('currency', 'EGP')
                ->whereMonth('date', $i)->whereYear('date', $year)->sum('amount');
            $exp = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)
                ->where('currency', 'EGP')
                ->whereMonth('date', $i)->whereYear('date', $year)->sum('amount');
            $monthlyRevenue[] = ['month' => $i, 'revenue' => $rev, 'expenses' => $exp];
        }

        $recentTransactions = TreasuryTransaction::orderByDesc('date')
            ->limit(10)->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'type' => $t->type,
                'amount' => $t->amount,
                'currency' => $t->currency,
                'category' => $t->category,
                'description' => $t->description,
                'date' => $t->date?->format('Y-m-d'),
            ]);

        return [
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_profit' => $totalRevenue - $totalExpenses,
            'pending_invoices' => Invoice::where('status', Invoice::STATUS_PENDING)->count(),
            'overdue_invoices' => Invoice::where('status', Invoice::STATUS_OVERDUE)->count(),
            'paid_invoices' => Invoice::where('status', Invoice::STATUS_PAID)->count(),
            'total_salaries' => SalaryPayment::whereMonth('payment_date', now()->month)->sum('amount'),
            'monthly_revenue' => $monthlyRevenue,
            'recent_transactions' => $recentTransactions,
            'recent_invoices' => Invoice::with('contract.client')
                ->orderByDesc('created_at')->limit(5)->get()
                ->map(fn($inv) => [
                    'id' => $inv->id,
                    'client_name' => $inv->contract?->client?->name,
                    'amount' => $inv->amount,
                    'currency' => $inv->currency,
                    'due_date' => $inv->due_date?->format('Y-m-d'),
                    'status' => $inv->status,
                ]),
        ];
    }

    private function getSalesData(?string $dateFrom, ?string $dateTo): array
    {
        $leadsQuery = Lead::query();
        if ($dateFrom && $dateTo) {
            $leadsQuery->whereBetween('created_at', [$dateFrom, $dateTo]);
        }
        $leadsCount = (clone $leadsQuery)->count();
        $convertedLeads = (clone $leadsQuery)->where('stage', 'contract_signed')->count();
        $conversionRate = $leadsCount > 0 ? round(($convertedLeads / $leadsCount) * 100, 1) : 0;

        $leadsByStage = Lead::selectRaw('stage, COUNT(*) as count')
            ->groupBy('stage')->pluck('count', 'stage');

        return [
            'clients_count' => Client::count(),
            'active_contracts' => Contract::where('status', Contract::STATUS_ACTIVE)->count(),
            'total_leads' => $leadsCount,
            'new_leads' => Lead::where('stage', 'new')->count(),
            'conversion_rate' => $conversionRate,
            'leads_by_stage' => $leadsByStage,
            'total_revenue' => TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)->where('currency', 'EGP')->sum('amount'),
            'pending_invoices' => Invoice::whereIn('status', [Invoice::STATUS_PENDING, Invoice::STATUS_OVERDUE])->count(),
            'recent_invoices' => Invoice::with('contract.client')
                ->orderByDesc('created_at')->limit(5)->get()
                ->map(fn($inv) => [
                    'id' => $inv->id,
                    'client_name' => $inv->contract?->client?->name,
                    'amount' => $inv->amount,
                    'currency' => $inv->currency,
                    'status' => $inv->status,
                ]),
        ];
    }

    private function getEmployeeData(int $userId): array
    {
        $myTasks = Task::where(function ($q) use ($userId) {
            $q->where('assigned_to', $userId)
              ->orWhereHas('assignees', fn($q2) => $q2->where('user_id', $userId));
        });

        $totalTasks = (clone $myTasks)->count();
        $completedTasks = (clone $myTasks)->where('status', Task::STATUS_DONE)->count();
        $overdueTasks = (clone $myTasks)->where('due_date', '<', now())->whereNot('status', Task::STATUS_DONE)->count();
        $inProgressTasks = (clone $myTasks)->where('status', Task::STATUS_IN_PROGRESS)->count();

        $tasksByStatus = [
            'todo' => (clone $myTasks)->where('status', Task::STATUS_TODO)->count(),
            'in_progress' => $inProgressTasks,
            'review' => (clone $myTasks)->where('status', Task::STATUS_REVIEW)->count(),
            'done' => $completedTasks,
        ];

        $weeklyHours = TimeEntry::where('user_id', $userId)
            ->whereBetween('started_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->sum('duration_minutes');

        $myProjects = Project::whereHas('tasks', function ($q) use ($userId) {
            $q->where('assigned_to', $userId)
              ->orWhereHas('assignees', fn($q2) => $q2->where('user_id', $userId));
        })->count();

        $upcomingTasks = Task::with('project')
            ->where(function ($q) use ($userId) {
                $q->where('assigned_to', $userId)
                  ->orWhereHas('assignees', fn($q2) => $q2->where('user_id', $userId));
            })
            ->where('due_date', '>=', now())
            ->whereNot('status', Task::STATUS_DONE)
            ->orderBy('due_date')
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'status' => $t->status,
                'priority' => $t->priority,
                'due_date' => $t->due_date?->format('Y-m-d'),
                'project' => $t->project?->name,
            ]);

        return [
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'overdue_tasks' => $overdueTasks,
            'in_progress_tasks' => $inProgressTasks,
            'tasks_by_status' => $tasksByStatus,
            'weekly_hours' => round($weeklyHours / 60, 1),
            'my_projects' => $myProjects,
            'upcoming_tasks' => $upcomingTasks,
        ];
    }
}
