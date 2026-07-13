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
use Carbon\Carbon;
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

        // Financial figures (revenue / profit / collection) are exposed ONLY to the
        // top roles. Managers & account managers get an operations-only dataset with
        // no money in it — the numbers never leave the server for these roles.
        $roleData = match ($role) {
            'super_admin', 'company_admin' => $this->getSuperAdminData($year, $dateFrom, $dateTo),
            'manager', 'marketing_manager' => $this->getManagerOpsData(),
            'accountant' => $this->getAccountantData($year, $dateFrom, $dateTo),
            'sales' => $this->getSalesData($dateFrom, $dateTo),
            'employee' => $this->getEmployeeData($user->id),
            default => $this->getEmployeeData($user->id),
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

        // Use client-provided "last seen" timestamps, fallback to 7 days
        $tasksSince = $request->query('tasks_since')
            ? Carbon::parse($request->query('tasks_since'))
            : now()->subDays(7);

        $projectsSince = $request->query('projects_since')
            ? Carbon::parse($request->query('projects_since'))
            : now()->subDays(7);

        // New tasks assigned to user since last visit (not done)
        $newTasks = Task::where(function ($q) use ($userId) {
            $q->where('assigned_to', $userId)
              ->orWhereHas('assignees', fn($q2) => $q2->where('user_id', $userId));
        })
            ->whereIn('status', ['todo', 'in_progress'])
            ->where('created_at', '>=', $tasksSince)
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

        // New projects since last visit
        $newProjects = Project::where('status', 'active')
            ->where('created_at', '>=', $projectsSince)
            ->count();

        // Overdue invoices
        $overdueInvoices = Invoice::where('status', Invoice::STATUS_OVERDUE)->count();

        // New leads (last 7 days)
        $newLeads = Lead::where('stage', 'new')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        // Pending salary payments for current month
        $pendingSalaries = SalaryPayment::where('remaining', '>', 0)
            ->where('month', now()->month)
            ->where('year', now()->year)
            ->count();

        // Open tickets
        $openTickets = 0;
        try {
            $openTickets = \DB::table('tickets')
                ->whereIn('status', ['open', 'in_progress'])
                ->count();
        } catch (\Throwable $e) {
            // tickets table may not exist
        }

        return $this->successResponse([
            'new_tasks' => $newTasks,
            'upcoming_meetings' => $upcomingMeetings,
            'new_projects' => $newProjects,
            'overdue_invoices' => $overdueInvoices,
            'new_leads' => $newLeads,
            'pending_salaries' => $pendingSalaries,
            'open_tickets' => $openTickets,
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
        $data['employees_count'] = Employee::count();
        return $data;
    }

    private function getManagerData(int $year, ?string $dateFrom, ?string $dateTo): array
    {
        // ===== Treasury: single query for revenue/expenses =====
        $treasuryAgg = TreasuryTransaction::where('currency', 'EGP')
            ->when($dateFrom && $dateTo, fn($q) => $q->whereBetween('date', [$dateFrom, $dateTo]))
            ->selectRaw("
                SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as total_revenue,
                SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as total_expenses
            ", [TreasuryTransaction::TYPE_IN, TreasuryTransaction::TYPE_OUT])
            ->first();

        $totalRevenue = (float) ($treasuryAgg->total_revenue ?? 0);
        $totalExpenses = (float) ($treasuryAgg->total_expenses ?? 0);

        // ===== Tasks: single query for all status counts =====
        $taskStats = Task::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review,
            SUM(CASE WHEN due_date < NOW() AND status != 'done' THEN 1 ELSE 0 END) as overdue
        ")->first();

        $totalTasks = (int) $taskStats->total;
        $completedTasks = (int) $taskStats->completed;
        $overdueTasks = (int) $taskStats->overdue;

        $tasksByStatus = [
            'todo'        => (int) $taskStats->todo,
            'in_progress' => (int) $taskStats->in_progress,
            'review'      => (int) $taskStats->review,
            'done'        => $completedTasks,
        ];

        $taskCompletionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

        // ===== Invoices: single query for all counts =====
        $invoiceStats = Invoice::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as paid,
            SUM(CASE WHEN status IN (?, ?) THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as overdue,
            SUM(amount) as total_invoiced,
            SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as total_collected
        ", [
            Invoice::STATUS_PAID,
            Invoice::STATUS_PENDING, Invoice::STATUS_OVERDUE,
            Invoice::STATUS_OVERDUE,
            Invoice::STATUS_PAID,
        ])->first();

        $totalInvoices = (int) $invoiceStats->total;
        $paidInvoices = (int) $invoiceStats->paid;
        $invoicePaymentRate = $totalInvoices > 0 ? round(($paidInvoices / $totalInvoices) * 100, 1) : 0;

        // ===== Projects: single query =====
        $projectStats = Project::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        ")->first();

        // Monthly revenue chart (single query with conditional aggregation)
        $monthlyRevenue = TreasuryTransaction::where('currency', 'EGP')
            ->whereYear('date', $year)
            ->selectRaw("
                MONTH(date) as month,
                SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as revenue,
                SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as expenses
            ", [TreasuryTransaction::TYPE_IN, TreasuryTransaction::TYPE_OUT])
            ->groupByRaw('MONTH(date)')
            ->get()
            ->keyBy('month');

        $monthlyRevenueData = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthlyRevenueData[] = [
                'month'    => $i,
                'revenue'  => (float) ($monthlyRevenue[$i]->revenue ?? 0),
                'expenses' => (float) ($monthlyRevenue[$i]->expenses ?? 0),
            ];
        }

        // Weekly time tracking
        $weeklyHours = TimeEntry::whereBetween('started_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->sum('duration_minutes');

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

        // ===== This month / Last month: single query each =====
        $currentMonthTreasury = TreasuryTransaction::where('currency', 'EGP')
            ->whereMonth('date', now()->month)->whereYear('date', now()->year)
            ->selectRaw("
                SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as revenue,
                SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as expenses
            ", [TreasuryTransaction::TYPE_IN, TreasuryTransaction::TYPE_OUT])
            ->first();

        $lastMonthTreasury = TreasuryTransaction::where('currency', 'EGP')
            ->whereMonth('date', now()->subMonth()->month)->whereYear('date', now()->subMonth()->year)
            ->selectRaw("
                SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as revenue,
                SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as expenses
            ", [TreasuryTransaction::TYPE_IN, TreasuryTransaction::TYPE_OUT])
            ->first();

        // Salary stats (single query)
        $salaryStats = SalaryPayment::where('month', now()->month)->where('year', now()->year)
            ->selectRaw("
                SUM(CASE WHEN remaining > 0 THEN 1 ELSE 0 END) as pending,
                SUM(total) as total_amount
            ")->first();

        return [
            'clients_count' => Client::count(),
            'active_contracts' => Contract::where('status', Contract::STATUS_ACTIVE)->count(),
            'pending_invoices' => (int) $invoiceStats->pending,
            'overdue_invoices' => (int) $invoiceStats->overdue,
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_profit' => $totalRevenue - $totalExpenses,
            'profit_margin' => $totalRevenue > 0 ? round(($totalRevenue - $totalExpenses) / $totalRevenue * 100, 1) : 0,
            'total_projects' => (int) $projectStats->total,
            'active_projects' => (int) $projectStats->active,
            'completed_projects' => (int) $projectStats->completed,
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'overdue_tasks' => $overdueTasks,
            'task_completion_rate' => $taskCompletionRate,
            'invoice_payment_rate' => $invoicePaymentRate,
            'weekly_hours' => round($weeklyHours / 60, 1),
            'tasks_by_status' => $tasksByStatus,
            'task_status_distribution' => [
                ['name' => 'جديد',        'value' => $tasksByStatus['todo']],
                ['name' => 'قيد التنفيذ', 'value' => $tasksByStatus['in_progress']],
                ['name' => 'مراجعة',      'value' => $tasksByStatus['review']],
                ['name' => 'مكتمل',       'value' => $tasksByStatus['done']],
            ],
            'monthly_revenue' => $monthlyRevenueData,
            'expense_distribution' => $expDist,
            'recent_invoices' => $recentInvoices,
            'project_progress' => $projectProgress,
            'employees_count' => Employee::count(),
            'team_count' => User::where('role', '!=', 'super_admin')->count(),

            // --- Enhanced KPIs ---
            'total_contracts_value' => Contract::where('status', Contract::STATUS_ACTIVE)->sum('value'),
            'total_invoiced' => (float) $invoiceStats->total_invoiced,
            'total_collected' => (float) $invoiceStats->total_collected,
            'collection_rate' => $invoiceStats->total_invoiced > 0 ? round($invoiceStats->total_collected / $invoiceStats->total_invoiced * 100, 1) : 0,
            'avg_project_progress' => $projectProgress->avg('progress') ?? 0,
            'leads_count' => Lead::count(),
            'leads_won' => Lead::where('stage', 'won')->count(),
            'leads_conversion_rate' => Lead::count() > 0 ? round(Lead::where('stage', 'won')->count() / Lead::count() * 100, 1) : 0,
            'this_month_revenue' => (float) ($currentMonthTreasury->revenue ?? 0),
            'this_month_expenses' => (float) ($currentMonthTreasury->expenses ?? 0),
            'last_month_revenue' => (float) ($lastMonthTreasury->revenue ?? 0),
            'last_month_expenses' => (float) ($lastMonthTreasury->expenses ?? 0),
            'pending_salaries' => (int) ($salaryStats->pending ?? 0),
            'total_salaries_month' => (float) ($salaryStats->total_amount ?? 0),
        ];
    }

    /**
     * Operations dashboard for managers / account managers — projects, tasks and
     * team only. Deliberately contains NO revenue, profit, expenses or invoice
     * amounts, so financial data is never sent to these roles.
     */
    private function getManagerOpsData(): array
    {
        $taskStats = Task::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review,
            SUM(CASE WHEN due_date < NOW() AND status != 'done' THEN 1 ELSE 0 END) as overdue
        ")->first();

        $totalTasks     = (int) $taskStats->total;
        $completedTasks = (int) $taskStats->completed;

        $tasksByStatus = [
            'todo'        => (int) $taskStats->todo,
            'in_progress' => (int) $taskStats->in_progress,
            'review'      => (int) $taskStats->review,
            'done'        => $completedTasks,
        ];

        $projectStats = Project::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        ")->first();

        $projectProgress = Project::where('status', Project::STATUS_ACTIVE)
            ->withCount(['tasks', 'tasks as completed_tasks_count' => fn($q) => $q->where('status', Task::STATUS_DONE)])
            ->limit(10)->get()
            ->map(fn($p) => [
                'id'              => $p->id,
                'slug'            => $p->slug,
                'name'            => $p->name,
                'total_tasks'     => $p->tasks_count,
                'completed_tasks' => $p->completed_tasks_count,
                'progress'        => $p->tasks_count > 0 ? round(($p->completed_tasks_count / $p->tasks_count) * 100) : 0,
                'end_date'        => $p->end_date,
            ]);

        return [
            'total_tasks'          => $totalTasks,
            'completed_tasks'      => $completedTasks,
            'overdue_tasks'        => (int) $taskStats->overdue,
            'task_completion_rate' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0,
            'tasks_by_status'      => $tasksByStatus,
            'task_status_distribution' => [
                ['name' => 'جديد',        'value' => $tasksByStatus['todo']],
                ['name' => 'قيد التنفيذ', 'value' => $tasksByStatus['in_progress']],
                ['name' => 'مراجعة',      'value' => $tasksByStatus['review']],
                ['name' => 'مكتمل',       'value' => $completedTasks],
            ],
            'total_projects'     => (int) $projectStats->total,
            'active_projects'    => (int) $projectStats->active,
            'completed_projects' => (int) $projectStats->completed,
            'project_progress'   => $projectProgress,
            'clients_count'      => Client::count(),
            'active_contracts'   => Contract::where('status', Contract::STATUS_ACTIVE)->count(),
            'team_count'         => User::where('role', '!=', 'super_admin')->count(),
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
        // Reusable "assigned to me" constraint (direct assignee OR multi-assignee pivot).
        $mine = fn($q) => $q->where('assigned_to', $userId)
            ->orWhereHas('assignees', fn($q2) => $q2->where('user_id', $userId));

        $myTasks = Task::where($mine);

        $totalTasks      = (clone $myTasks)->count();
        $completedTasks  = (clone $myTasks)->where('status', Task::STATUS_DONE)->count();
        $overdueTasks    = (clone $myTasks)->where('due_date', '<', now())->whereNot('status', Task::STATUS_DONE)->count();
        $inProgressTasks = (clone $myTasks)->where('status', Task::STATUS_IN_PROGRESS)->count();
        $todoTasks       = (clone $myTasks)->where('status', Task::STATUS_TODO)->count();
        $reviewTasks     = (clone $myTasks)->where('status', Task::STATUS_REVIEW)->count();
        $dueTodayTasks   = (clone $myTasks)->whereDate('due_date', today())->whereNot('status', Task::STATUS_DONE)->count();

        $tasksByStatus = [
            'todo'        => $todoTasks,
            'in_progress' => $inProgressTasks,
            'review'      => $reviewTasks,
            'done'        => $completedTasks,
        ];

        // Chart-ready distribution (frontend expects [{name, value}]).
        $taskStatusDistribution = [
            ['name' => 'جديد',        'value' => $todoTasks],
            ['name' => 'قيد التنفيذ', 'value' => $inProgressTasks],
            ['name' => 'مراجعة',      'value' => $reviewTasks],
            ['name' => 'مكتمل',       'value' => $completedTasks],
        ];

        $weeklyMinutes = TimeEntry::where('user_id', $userId)
            ->whereBetween('started_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->sum('duration_minutes');
        $todayMinutes = TimeEntry::where('user_id', $userId)
            ->whereDate('started_at', today())
            ->sum('duration_minutes');

        // The person's own projects with their personal task counts — this is what
        // makes each employee's dashboard concretely different (their real work).
        $myProjectsList = Project::whereHas('tasks', $mine)
            ->withCount([
                'tasks as my_total' => $mine,
                'tasks as my_done'  => fn($q) => $q->where($mine)->where('status', Task::STATUS_DONE),
            ])
            ->orderByDesc('updated_at')
            ->limit(6)
            ->get()
            ->map(fn($p) => [
                'id'       => $p->id,
                'slug'     => $p->slug,
                'name'     => $p->name,
                'total'    => $p->my_total,
                'done'     => $p->my_done,
                'progress' => $p->my_total > 0 ? round(($p->my_done / $p->my_total) * 100) : 0,
            ]);

        // The person's own recent tasks (overrides the company-wide list from common).
        $myRecentTasks = Task::with('assignedUser')
            ->where($mine)
            ->orderByDesc('updated_at')
            ->limit(6)
            ->get()
            ->map(fn($t) => [
                'id'               => $t->id,
                'title'            => $t->title,
                'assigned_to_name' => $t->assignedUser?->name,
                'status'           => $t->status,
                'priority'         => $t->priority,
                'due_date'         => $t->due_date?->format('Y-m-d'),
            ]);

        $upcomingTasks = Task::with('project')
            ->where($mine)
            ->where('due_date', '>=', now())
            ->whereNot('status', Task::STATUS_DONE)
            ->orderBy('due_date')
            ->limit(9)
            ->get()
            ->map(fn($t) => [
                'id'       => $t->id,
                'title'    => $t->title,
                'status'   => $t->status,
                'priority' => $t->priority,
                'due_date' => $t->due_date?->format('Y-m-d'),
                'project'  => $t->project?->name,
            ]);

        // Job title (position) → drives the personalised header per function.
        $position = Employee::where('user_id', $userId)->value('position');

        return [
            'position'                 => $position,
            'my_tasks'                 => $totalTasks,
            'total_tasks'              => $totalTasks,
            'completed_tasks'          => $completedTasks,
            'overdue_tasks'            => $overdueTasks,
            'in_progress_tasks'        => $inProgressTasks,
            'review_tasks'             => $reviewTasks,
            'due_today_tasks'          => $dueTodayTasks,
            'tasks_by_status'          => $tasksByStatus,
            'task_status_distribution' => $taskStatusDistribution,
            'today_hours'              => round($todayMinutes / 60, 1),
            'week_hours'               => round($weeklyMinutes / 60, 1),
            'weekly_hours'             => round($weeklyMinutes / 60, 1),
            'my_projects'              => $myProjectsList->count(),
            'my_projects_list'         => $myProjectsList,
            'recent_tasks'             => $myRecentTasks,
            'upcoming_deadlines'       => $upcomingTasks,
            'upcoming_tasks'           => $upcomingTasks,
        ];
    }
}
