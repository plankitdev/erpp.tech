<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\SalaryPayment;

class SalaryService
{
    public function generateMonthlySalaries(int $month, int $year): array
    {
        $employees = Employee::all();
        $salaries = [];

        foreach ($employees as $employee) {
            $existing = SalaryPayment::where('employee_id', $employee->id)
                ->where('month', $month)
                ->where('year', $year)
                ->exists();

            if (!$existing) {
                $salary = SalaryPayment::create([
                    'employee_id'  => $employee->id,
                    'month'        => $month,
                    'year'         => $year,
                    'base_salary'  => $employee->base_salary,
                    'deductions'   => 0,
                    'total'        => $employee->base_salary,
                    'transfer_amount' => 0,
                    'remaining'    => $employee->base_salary,
                ]);
                $salaries[] = $salary;
            }
        }

        return $salaries;
    }

    public function markAsPaid(SalaryPayment $salary, float $transferAmount, ?string $paymentDate = null): SalaryPayment
    {
        // SalaryPayment.booted() updated handler auto-creates treasury transaction
        $salary->update([
            'transfer_amount' => $transferAmount,
            'remaining'       => $salary->total - $transferAmount,
            'payment_date'    => $paymentDate ?? now()->toDateString(),
        ]);

        return $salary;
    }
}
