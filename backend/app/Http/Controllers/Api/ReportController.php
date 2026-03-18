<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\SalaryPayment;
use App\Models\Partner;
use App\Models\TreasuryTransaction;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    use ApiResponse;

    public function monthly(Request $request): JsonResponse
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);
        $currency = $request->input('currency', 'EGP');

        $revenue = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)->where('currency', $currency)
            ->whereYear('date', $year)->whereMonth('date', $month)->sum('amount');
        $expenses = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)->where('currency', $currency)
            ->whereYear('date', $year)->whereMonth('date', $month)->sum('amount');
        $salaries = SalaryPayment::where('month', $month)->where('year', $year)->sum('total');

        return $this->successResponse([
            'summary' => [
                'الإيرادات' => $revenue,
                'المصروفات' => $expenses,
                'الرواتب' => $salaries,
                'صافي الربح' => $revenue - $expenses,
            ],
            'chart_data' => [
                ['label' => 'إيرادات', 'value' => $revenue],
                ['label' => 'مصروفات', 'value' => $expenses],
                ['label' => 'رواتب', 'value' => $salaries],
                ['label' => 'صافي', 'value' => $revenue - $expenses],
            ],
        ]);
    }

    public function yearly(Request $request): JsonResponse
    {
        $year = $request->input('year', now()->year);
        $currency = $request->input('currency', 'EGP');
        $chartData = [];

        for ($m = 1; $m <= 12; $m++) {
            $rev = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)->where('currency', $currency)
                ->whereYear('date', $year)->whereMonth('date', $m)->sum('amount');
            $exp = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)->where('currency', $currency)
                ->whereYear('date', $year)->whereMonth('date', $m)->sum('amount');
            $chartData[] = [
                'label' => "شهر {$m}",
                'revenue' => $rev,
                'expenses' => $exp,
                'profit' => $rev - $exp,
            ];
        }

        $totalRev = collect($chartData)->sum('revenue');
        $totalExp = collect($chartData)->sum('expenses');

        return $this->successResponse([
            'summary' => [
                'إجمالي الإيرادات' => $totalRev,
                'إجمالي المصروفات' => $totalExp,
                'صافي الربح' => $totalRev - $totalExp,
            ],
            'chart_data' => $chartData,
        ]);
    }

    public function clients(): JsonResponse
    {
        $clients = Client::with(['contracts.invoices'])->get();

        $tableData = $clients->map(function ($client) {
            $totalDue = $client->contracts->flatMap->invoices->sum('amount');
            $totalPaid = $client->contracts->flatMap->invoices->sum(function ($inv) {
                return $inv->payments->sum('amount');
            });
            return [
                'العميل' => $client->name,
                'المستحقات' => $totalDue,
                'المدفوع' => $totalPaid,
                'المتبقي' => $totalDue - $totalPaid,
                'نسبة التحصيل' => $totalDue > 0 ? round(($totalPaid / $totalDue) * 100, 1) . '%' : '0%',
            ];
        });

        return $this->successResponse([
            'summary' => [
                'إجمالي العملاء' => $clients->count(),
                'إجمالي المستحقات' => $tableData->sum('المستحقات'),
                'إجمالي المدفوع' => $tableData->sum('المدفوع'),
            ],
            'table_headers' => ['العميل', 'المستحقات', 'المدفوع', 'المتبقي', 'نسبة التحصيل'],
            'table_data' => $tableData,
        ]);
    }

    public function salaries(Request $request): JsonResponse
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        $salaries = SalaryPayment::with('employee')
            ->where('month', $month)->where('year', $year)->get();

        $tableData = $salaries->map(fn($s) => [
            'الموظف' => $s->employee?->name,
            'الأساسي' => $s->base_salary,
            'الخصومات' => $s->deductions,
            'الإجمالي' => $s->total,
            'المحول' => $s->transfer_amount,
            'المتبقي' => $s->remaining,
        ]);

        return $this->successResponse([
            'summary' => [
                'عدد الموظفين' => $salaries->count(),
                'إجمالي الرواتب' => $salaries->sum('total'),
                'إجمالي المحول' => $salaries->sum('transfer_amount'),
                'إجمالي المتبقي' => $salaries->sum('remaining'),
            ],
            'table_headers' => ['الموظف', 'الأساسي', 'الخصومات', 'الإجمالي', 'المحول', 'المتبقي'],
            'table_data' => $tableData,
        ]);
    }

    public function treasury(Request $request): JsonResponse
    {
        $year = $request->input('year', now()->year);
        $currency = $request->input('currency');

        $chartData = [];
        for ($m = 1; $m <= 12; $m++) {
            $inQ = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)
                ->whereYear('date', $year)->whereMonth('date', $m);
            $outQ = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)
                ->whereYear('date', $year)->whereMonth('date', $m);
            if ($currency) { $inQ->where('currency', $currency); $outQ->where('currency', $currency); }
            $chartData[] = ['label' => "شهر {$m}", 'value' => $inQ->sum('amount') - $outQ->sum('amount')];
        }

        $totalInQ = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)->whereYear('date', $year);
        $totalOutQ = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)->whereYear('date', $year);
        if ($currency) { $totalInQ->where('currency', $currency); $totalOutQ->where('currency', $currency); }

        return $this->successResponse([
            'summary' => [
                'إجمالي الوارد' => $totalInQ->sum('amount'),
                'إجمالي الصادر' => $totalOutQ->sum('amount'),
            ],
            'chart_data' => $chartData,
        ]);
    }

    public function partners(Request $request): JsonResponse
    {
        $currency = $request->input('currency', 'EGP');

        $totalRevenue = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)
            ->where('currency', $currency)->sum('amount');
        $totalExpenses = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)
            ->where('currency', $currency)->sum('amount');
        $netProfit = $totalRevenue - $totalExpenses;

        $partners = Partner::all();
        $tableData = $partners->map(fn($p) => [
            'الشريك' => $p->name,
            'النسبة' => $p->share_percentage . '%',
            'نصيب الربح' => round($netProfit * $p->share_percentage / 100, 2),
        ]);

        return $this->successResponse([
            'summary' => [
                'صافي الربح' => $netProfit,
                'عدد الشركاء' => $partners->count(),
            ],
            'table_headers' => ['الشريك', 'النسبة', 'نصيب الربح'],
            'table_data' => $tableData,
        ]);
    }

    public function profitLoss(Request $request): JsonResponse
    {
        $year = $request->input('year', now()->year);
        $currency = $request->input('currency', 'EGP');
        $monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        $monthly = [];
        for ($m = 1; $m <= 12; $m++) {
            // Revenue: invoice payments received
            $invoiceRevenue = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)
                ->where('currency', $currency)
                ->whereYear('date', $year)->whereMonth('date', $m)->sum('amount');

            // Expenses by category
            $operatingExpenses = Expense::where('currency', $currency)
                ->whereYear('date', $year)->whereMonth('date', $m)->sum('amount');

            $salaryExpenses = SalaryPayment::where('month', $m)->where('year', $year)->sum('total');

            $otherExpenses = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)
                ->where('currency', $currency)
                ->whereYear('date', $year)->whereMonth('date', $m)
                ->where('category', '!=', 'salary')
                ->where('category', '!=', 'expense')
                ->sum('amount');

            $totalExpenses = $operatingExpenses + $salaryExpenses + $otherExpenses;
            $grossProfit = $invoiceRevenue - $operatingExpenses;
            $netProfit = $invoiceRevenue - $totalExpenses;

            $monthly[] = [
                'month' => $m,
                'month_name' => $monthNames[$m - 1],
                'revenue' => round($invoiceRevenue, 2),
                'operating_expenses' => round($operatingExpenses, 2),
                'salaries' => round($salaryExpenses, 2),
                'other_expenses' => round($otherExpenses, 2),
                'total_expenses' => round($totalExpenses, 2),
                'gross_profit' => round($grossProfit, 2),
                'net_profit' => round($netProfit, 2),
                'margin' => $invoiceRevenue > 0 ? round(($netProfit / $invoiceRevenue) * 100, 1) : 0,
            ];
        }

        $totals = [
            'total_revenue' => collect($monthly)->sum('revenue'),
            'total_operating_expenses' => collect($monthly)->sum('operating_expenses'),
            'total_salaries' => collect($monthly)->sum('salaries'),
            'total_other_expenses' => collect($monthly)->sum('other_expenses'),
            'total_expenses' => collect($monthly)->sum('total_expenses'),
            'gross_profit' => collect($monthly)->sum('gross_profit'),
            'net_profit' => collect($monthly)->sum('net_profit'),
        ];
        $totals['margin'] = $totals['total_revenue'] > 0
            ? round(($totals['net_profit'] / $totals['total_revenue']) * 100, 1) : 0;

        // Expense breakdown
        $expenseBreakdown = Expense::where('currency', $currency)
            ->whereYear('date', $year)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category')
            ->toArray();

        return $this->successResponse([
            'year' => $year,
            'currency' => $currency,
            'monthly' => $monthly,
            'totals' => $totals,
            'expense_breakdown' => $expenseBreakdown,
        ]);
    }

    public function cashFlow(Request $request): JsonResponse
    {
        $year = $request->input('year', now()->year);
        $currency = $request->input('currency', 'EGP');
        $monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        $monthly = [];
        $cumulativeBalance = 0;

        for ($m = 1; $m <= 12; $m++) {
            // Cash In (by category)
            $invoicePayments = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)
                ->where('currency', $currency)
                ->where('category', 'invoice_payment')
                ->whereYear('date', $year)->whereMonth('date', $m)->sum('amount');

            $capitalContributions = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_IN)
                ->where('currency', $currency)
                ->whereNotIn('category', ['invoice_payment'])
                ->whereYear('date', $year)->whereMonth('date', $m)->sum('amount');

            $totalIn = $invoicePayments + $capitalContributions;

            // Cash Out (by category)
            $salaryPayments = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)
                ->where('currency', $currency)
                ->where('category', 'salary')
                ->whereYear('date', $year)->whereMonth('date', $m)->sum('amount');

            $operatingExpenses = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)
                ->where('currency', $currency)
                ->where('category', 'expense')
                ->whereYear('date', $year)->whereMonth('date', $m)->sum('amount');

            $otherOut = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)
                ->where('currency', $currency)
                ->whereNotIn('category', ['salary', 'expense'])
                ->whereYear('date', $year)->whereMonth('date', $m)->sum('amount');

            $totalOut = $salaryPayments + $operatingExpenses + $otherOut;
            $netFlow = $totalIn - $totalOut;
            $cumulativeBalance += $netFlow;

            $monthly[] = [
                'month' => $m,
                'month_name' => $monthNames[$m - 1],
                'cash_in' => round($totalIn, 2),
                'invoice_payments' => round($invoicePayments, 2),
                'other_income' => round($capitalContributions, 2),
                'cash_out' => round($totalOut, 2),
                'salary_payments' => round($salaryPayments, 2),
                'operating_expenses' => round($operatingExpenses, 2),
                'other_expenses' => round($otherOut, 2),
                'net_flow' => round($netFlow, 2),
                'cumulative_balance' => round($cumulativeBalance, 2),
            ];
        }

        // Current balance
        $currentBalance = TreasuryTransaction::where('currency', $currency)
            ->orderBy('id', 'desc')->value('balance_after') ?? 0;

        $totals = [
            'total_cash_in' => collect($monthly)->sum('cash_in'),
            'total_cash_out' => collect($monthly)->sum('cash_out'),
            'net_cash_flow' => collect($monthly)->sum('net_flow'),
            'current_balance' => $currentBalance,
        ];

        return $this->successResponse([
            'year' => $year,
            'currency' => $currency,
            'monthly' => $monthly,
            'totals' => $totals,
        ]);
    }

    public function kpiReport(Request $request): JsonResponse
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);
        $startDate = \Carbon\Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // Sales KPIs
        $totalLeads = \App\Models\Lead::whereBetween('created_at', [$startDate, $endDate])->count();
        $convertedLeads = \App\Models\Lead::where('stage', 'contract_signed')->whereBetween('updated_at', [$startDate, $endDate])->count();
        $salesRevenue = TreasuryTransaction::where('type', 'in')->whereBetween('date', [$startDate, $endDate])->sum('amount');

        // Projects KPIs
        $activeProjects = \App\Models\Project::where('status', 'active')->count();
        $completedProjects = \App\Models\Project::where('status', 'completed')->whereBetween('updated_at', [$startDate, $endDate])->count();
        $totalTasks = \App\Models\Task::whereBetween('created_at', [$startDate, $endDate])->count();
        $completedTasks = \App\Models\Task::where('status', 'done')->whereBetween('updated_at', [$startDate, $endDate])->count();
        $overdueTasks = \App\Models\Task::where('status', '!=', 'done')->where('due_date', '<', now())->count();

        // Finance KPIs
        $revenue = TreasuryTransaction::where('type', 'in')->whereBetween('date', [$startDate, $endDate])->sum('amount');
        $expenses = TreasuryTransaction::where('type', 'out')->whereBetween('date', [$startDate, $endDate])->sum('amount');
        $invoicesPaid = Invoice::where('status', 'paid')->whereBetween('paid_date', [$startDate, $endDate])->count();
        $invoicesOverdue = Invoice::where('status', 'overdue')->count();

        // HR KPIs
        $totalEmployees = \App\Models\Employee::count();
        $totalSalaries = SalaryPayment::where('month', $month)->where('year', $year)->sum('total');
        $totalHours = round(\App\Models\TimeEntry::whereBetween('started_at', [$startDate, $endDate])->sum('duration_minutes') / 60, 1);

        return $this->successResponse([
            'period' => ['year' => $year, 'month' => $month],
            'sales' => [
                'total_leads' => $totalLeads,
                'converted_leads' => $convertedLeads,
                'conversion_rate' => $totalLeads > 0 ? round(($convertedLeads / $totalLeads) * 100, 1) : 0,
                'revenue' => $salesRevenue,
            ],
            'projects' => [
                'active_projects' => $activeProjects,
                'completed_projects' => $completedProjects,
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'overdue_tasks' => $overdueTasks,
                'completion_rate' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0,
            ],
            'finance' => [
                'revenue' => $revenue,
                'expenses' => $expenses,
                'net_profit' => $revenue - $expenses,
                'margin' => $revenue > 0 ? round((($revenue - $expenses) / $revenue) * 100, 1) : 0,
                'invoices_paid' => $invoicesPaid,
                'invoices_overdue' => $invoicesOverdue,
            ],
            'hr' => [
                'total_employees' => $totalEmployees,
                'total_salaries' => $totalSalaries,
                'total_hours' => $totalHours,
                'avg_hours_per_employee' => $totalEmployees > 0 ? round($totalHours / $totalEmployees, 1) : 0,
            ],
        ]);
    }

    public function exportPdf(Request $request)
    {
        $type = $request->input('type', 'monthly');
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);
        $currency = $request->input('currency', 'EGP');

        // Get report data based on type
        $data = match ($type) {
            'monthly' => $this->monthly($request)->getData(true),
            'yearly' => $this->yearly($request)->getData(true),
            'clients' => $this->clients()->getData(true),
            'salaries' => $this->salaries($request)->getData(true),
            'profit-loss' => $this->profitLoss($request)->getData(true),
            'cash-flow' => $this->cashFlow($request)->getData(true),
            default => null,
        };

        if (!$data) {
            return $this->errorResponse('نوع التقرير غير صالح', 400);
        }

        $reportData = $data['data'] ?? $data;

        $typeLabels = [
            'monthly' => 'التقرير الشهري',
            'yearly' => 'التقرير السنوي',
            'clients' => 'تقرير العملاء',
            'salaries' => 'تقرير الرواتب',
            'profit-loss' => 'تقرير الأرباح والخسائر',
            'cash-flow' => 'تقرير التدفق النقدي',
        ];

        $html = view('reports.pdf', [
            'title' => $typeLabels[$type] ?? 'التقرير',
            'type' => $type,
            'data' => $reportData,
            'year' => $year,
            'month' => $month,
            'currency' => $currency,
            'company' => auth()->user()->company,
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download("report-{$type}-{$year}.pdf");
    }
}
