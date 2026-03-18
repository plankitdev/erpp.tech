<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Expense;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExpenseFactory extends Factory
{
    protected $model = Expense::class;

    public function definition(): array
    {
        return [
            'company_id'   => Company::factory(),
            'category'     => fake()->randomElement(['salaries', 'client', 'other']),
            'amount'       => fake()->randomFloat(2, 100, 20000),
            'currency'     => fake()->randomElement(['EGP', 'USD', 'SAR']),
            'date'         => fake()->dateTimeBetween('-1 year', 'now'),
            'notes'        => fake()->optional()->sentence(),
            'reference_id' => fake()->optional()->randomNumber(5),
        ];
    }
}
