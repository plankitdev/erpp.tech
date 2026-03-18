<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
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
}
