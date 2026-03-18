<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\TreasuryTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;

class TreasuryTransactionFactory extends Factory
{
    protected $model = TreasuryTransaction::class;

    public function definition(): array
    {
        return [
            'company_id'    => Company::factory(),
            'type'          => fake()->randomElement(TreasuryTransaction::TYPES),
            'amount'        => fake()->randomFloat(2, 100, 50000),
            'currency'      => fake()->randomElement(['EGP', 'USD', 'SAR']),
            'category'      => fake()->randomElement(TreasuryTransaction::CATEGORIES),
            'date'          => fake()->dateTimeBetween('-1 year', 'now'),
            'description'   => fake()->sentence(),
            'balance_after' => fake()->randomFloat(2, 0, 500000),
        ];
    }
}
