<?php

namespace App\Http\Controllers\Api;

use App\Traits\ApiResponse;
use App\Models\Task;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Contract;
use App\Models\Employee;
use App\Models\SalaryPayment;
use App\Models\TimeEntry;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class KpiController extends Controller
{
    use ApiResponse;

    public function personal(Request $request): JsonResponse
    {
        $user = Auth::user();
        $month = $request->get('month', now()->month);
        $year = $request->get('year', now()->year);
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $kpis = [];

        // ========== Tasks KPIs (all roles) ==========
        $tasksAssigned = Task::where('assigned_to', $user->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        $tasksCompleted = Task::where('assigned_to', $user->id)
            ->where('status', 'done')
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->count();

        $tasksOverdue = Task::where('assigned_to', $user->id)
            ->where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->count();

        $completionRate = $tasksAssigned > 0 ? round(($tasksCompleted / $tasksAssigned) * 100, 1) : 0;

        $kpis['tasks'] = [
            'assigned' => $tasksAssigned,
            'completed' => $tasksCompleted,
            'overdue' => $tasksOverdue,
            'completion_rate' => $completionRate,
            'target_rate' => 80,
        ];

        // ========== Time Tracking ==========
        $totalMinutes = TimeEntry::where('user_id', $user->id)
            ->whereBetween('started_at', [$startDate, $endDate])
            ->sum('duration_minutes');

        $kpis['time'] = [
            'total_hours' => round($totalMinutes / 60, 1),
            'target_hours' => 160,
            'daily_avg' => round($totalMinutes / 60 / max($startDate->diffInWeekdays(min($endDate, now())), 1), 1),
        ];

        // ========== Sales KPIs (sales role) ==========
        if (in_array($user->role, ['super_admin', 'manager', 'sales'])) {
            $leadsCreated = Lead::where('assigned_to', $user->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();

            $leadsConverted = Lead::where('assigned_to', $user->id)
                ->where('stage', 'contract_signed')
                ->whereBetween('updated_at', [$startDate, $endDate])
                ->count();

            $conversionRate = $leadsCreated > 0 ? round(($leadsConverted / $leadsCreated) * 100, 1) : 0;

            $revenue = Invoice::whereHas('contract.client', function ($q) use ($user) {
                    // For sales: invoices from their converted leads' contracts
                })
                ->where('status', 'paid')
                ->whereBetween('paid_date', [$startDate, $endDate])
                ->sum('amount');

            $kpis['sales'] = [
                'leads_created' => $leadsCreated,
                'leads_converted' => $leadsConverted,
                'conversion_rate' => $conversionRate,
                'target_conversion' => 25,
                'revenue' => $revenue,
            ];
        }

        // ========== Finance KPIs (accountant/manager) ==========
        if (in_array($user->role, ['super_admin', 'manager', 'accountant'])) {
            $invoicesPaid = Invoice::where('status', 'paid')
                ->whereBetween('paid_date', [$startDate, $endDate])
                ->count();

            $invoicesOverdue = Invoice::where('status', 'overdue')->count();

            $totalCollected = Invoice::where('status', 'paid')
                ->whereBetween('paid_date', [$startDate, $endDate])
                ->sum('amount');

            $kpis['finance'] = [
                'invoices_paid' => $invoicesPaid,
                'invoices_overdue' => $invoicesOverdue,
                'total_collected' => $totalCollected,
                'collection_rate' => Invoice::count() > 0
                    ? round(($invoicesPaid / max(Invoice::whereBetween('due_date', [$startDate, $endDate])->count(), 1)) * 100, 1)
                    : 0,
                'target_collection' => 90,
            ];
        }

        // ========== Monthly Trend (last 6 months) ==========
        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = now()->subMonths($i);
            $s = $m->copy()->startOfMonth();
            $e = $m->copy()->endOfMonth();

            $completed = Task::where('assigned_to', $user->id)
                ->where('status', 'done')
                ->whereBetween('updated_at', [$s, $e])
                ->count();

            $assigned = Task::where('assigned_to', $user->id)
                ->whereBetween('created_at', [$s, $e])
                ->count();

            $hours = round(TimeEntry::where('user_id', $user->id)
                ->whereBetween('started_at', [$s, $e])
                ->sum('duration_minutes') / 60, 1);

            $trend[] = [
                'month' => $m->format('Y-m'),
                'label' => $m->translatedFormat('M Y'),
                'tasks_completed' => $completed,
                'tasks_assigned' => $assigned,
                'hours_worked' => $hours,
            ];
        }

        $kpis['trend'] = $trend;

        return $this->successResponse($kpis);
    }

    public function team(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'manager'])) {
            return $this->errorResponse('غير مسموح', 403);
        }

        $month = $request->get('month', now()->month);
        $year = $request->get('year', now()->year);
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $employees = Employee::with('user:id,name,role')->get();

        $teamKpis = [];
        foreach ($employees as $emp) {
            if (!$emp->user) continue;

            $assigned = Task::where('assigned_to', $emp->user->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();

            $completed = Task::where('assigned_to', $emp->user->id)
                ->where('status', 'done')
                ->whereBetween('updated_at', [$startDate, $endDate])
                ->count();

            $hours = round(TimeEntry::where('user_id', $emp->user->id)
                ->whereBetween('started_at', [$startDate, $endDate])
                ->sum('duration_minutes') / 60, 1);

            $teamKpis[] = [
                'user_id' => $emp->user->id,
                'name' => $emp->user->name,
                'role' => $emp->user->role,
                'position' => $emp->position,
                'tasks_assigned' => $assigned,
                'tasks_completed' => $completed,
                'completion_rate' => $assigned > 0 ? round(($completed / $assigned) * 100, 1) : 0,
                'hours_worked' => $hours,
            ];
        }

        usort($teamKpis, fn($a, $b) => $b['completion_rate'] <=> $a['completion_rate']);

        return $this->successResponse($teamKpis);
    }
}
