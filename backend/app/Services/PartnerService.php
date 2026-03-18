<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Partner;
use App\Models\PartnerPayment;
use App\Models\SalaryPayment;
use App\Models\TreasuryTransaction;

class PartnerService
{
    public function getMonthlyProfitData(int $month, int $year): array
    {
        $revenue = Invoice::where('status', Invoice::STATUS_PAID)
            ->whereMonth('paid_date', $month)
            ->whereYear('paid_date', $year)
            ->sum('amount');

        $expenses = TreasuryTransaction::where('type', TreasuryTransaction::TYPE_OUT)
            ->whereNotIn('category', ['salaries', 'partner_payment'])
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->sum('amount');

        $salaries = SalaryPayment::whereMonth('payment_date', $month)
            ->whereYear('payment_date', $year)
            ->sum('total');

        $netProfit = $revenue - $expenses - $salaries;

        $partners = Partner::where('is_active', true)->get();
        $distribution = $partners->map(function ($partner) use ($netProfit, $month, $year) {
            $entitlement = round($netProfit * $partner->share_percentage / 100, 2);
            $received = $partner->getMonthlyReceived($month, $year);
            return [
                'id' => $partner->id,
                'name' => $partner->name,
                'share_percentage' => $partner->share_percentage,
                'capital' => (float) $partner->capital,
                'phone' => $partner->phone,
                'bank_account' => $partner->bank_account,
                'entitlement' => $entitlement,
                'received' => $received,
                'remaining' => round($entitlement - $received, 2),
            ];
        });

        return [
            'month' => $month,
            'year' => $year,
            'revenue' => round($revenue, 2),
            'expenses' => round($expenses, 2),
            'salaries' => round($salaries, 2),
            'net_profit' => round($netProfit, 2),
            'distribution' => $distribution,
        ];
    }

    public function getPartnerStatement(int $partnerId, int $year): array
    {
        $partner = Partner::findOrFail($partnerId);

        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $payments = PartnerPayment::where('partner_id', $partnerId)
                ->where('month', $m)
                ->where('year', $year)
                ->get();

            // Calculate this month's profit data
            $profitData = $this->getMonthlyProfitData($m, $year);
            $entitlement = round($profitData['net_profit'] * $partner->share_percentage / 100, 2);

            $inflow = $payments->whereIn('type', PartnerPayment::INFLOW_TYPES)->sum('amount');
            $outflow = $payments->whereNotIn('type', PartnerPayment::INFLOW_TYPES)->sum('amount');

            $months[] = [
                'month' => $m,
                'month_name' => $this->getArabicMonth($m),
                'revenue' => $profitData['revenue'],
                'expenses' => $profitData['expenses'],
                'salaries' => $profitData['salaries'],
                'net_profit' => $profitData['net_profit'],
                'entitlement' => $entitlement,
                'total' => $payments->sum('amount'),
                'inflow' => round($inflow, 2),
                'outflow' => round($outflow, 2),
                'payments' => $payments->map(fn($p) => [
                    'id' => $p->id,
                    'amount' => $p->amount,
                    'currency' => $p->currency,
                    'type' => $p->type,
                    'payment_date' => $p->payment_date->format('Y-m-d'),
                    'notes' => $p->notes,
                ]),
            ];
        }

        $allPayments = PartnerPayment::where('partner_id', $partnerId)
            ->where('year', $year)
            ->get();

        $byType = $allPayments->groupBy('type')->map(fn($group) => round($group->sum('amount'), 2));

        $totalEntitlement = collect($months)->sum('entitlement');
        $totalInflow = $allPayments->whereIn('type', PartnerPayment::INFLOW_TYPES)->sum('amount');
        $totalOutflow = $allPayments->whereNotIn('type', PartnerPayment::INFLOW_TYPES)->sum('amount');

        return [
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->name,
                'share_percentage' => $partner->share_percentage,
                'capital' => (float) $partner->capital,
                'phone' => $partner->phone,
                'bank_account' => $partner->bank_account,
                'is_active' => $partner->is_active,
                'created_at' => $partner->created_at->format('Y-m-d'),
            ],
            'year' => $year,
            'months' => $months,
            'total_entitlement' => round($totalEntitlement, 2),
            'total_received' => round($allPayments->sum('amount'), 2),
            'total_inflow' => round($totalInflow, 2),
            'total_outflow' => round($totalOutflow, 2),
            'by_type' => $byType,
        ];
    }

    public function getArabicMonth(int $month): string
    {
        $months = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس',
            4 => 'أبريل', 5 => 'مايو', 6 => 'يونيو',
            7 => 'يوليو', 8 => 'أغسطس', 9 => 'سبتمبر',
            10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر',
        ];
        return $months[$month] ?? '';
    }
}
