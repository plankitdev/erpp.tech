<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Employee;
use App\Models\SalaryPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

class SalaryPaymentFactory extends Factory
{
    protected $model = SalaryPayment::class;

    public function definition(): array
    {
        $baseSalary = fake()->randomFloat(2, 3000, 30000);
        $deductions = fake()->randomFloat(2, 0, $baseSalary * 0.2);
        $total = $baseSalary - $deductions;
        $transferAmount = fake()->randomFloat(2, 0, $total);

        return [
            'company_id'       => Company::factory(),
            'employee_id'      => Employee::factory(),
            'month'            => fake()->numberBetween(1, 12),
            'year'             => fake()->numberBetween(2023, 2025),
            'base_salary'      => $baseSalary,
            'deductions'       => $deductions,
            'deduction_reason' => fake()->optional()->sentence(),
            'total'            => $total,
            'transfer_amount'  => $transferAmount,
            'remaining'        => $total - $transferAmount,
            'payment_date'     => fake()->date(),
        ];
    }
}
