<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Company;
use App\Models\Contract;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContractFactory extends Factory
{
    protected $model = Contract::class;

    public function definition(): array
    {
        $value = fake()->randomFloat(2, 5000, 500000);

        return [
            'client_id'          => Client::factory(),
            'company_id'         => Company::factory(),
            'value'              => $value,
            'currency'           => fake()->randomElement(['EGP', 'USD', 'SAR']),
            'payment_type'       => fake()->randomElement(Contract::PAYMENT_TYPES),
            'start_date'         => fake()->dateTimeBetween('-1 year', 'now'),
            'end_date'           => fake()->dateTimeBetween('now', '+1 year'),
            'installments_count' => fake()->optional()->numberBetween(1, 12),
            'installment_amount' => fake()->optional()->randomFloat(2, 1000, 50000),
            'status'             => fake()->randomElement(Contract::STATUSES),
            'notes'              => fake()->optional()->sentence(),
        ];
    }
}
