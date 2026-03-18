<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Contract;
use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        return [
            'contract_id' => Contract::factory(),
            'company_id'  => Company::factory(),
            'amount'      => fake()->randomFloat(2, 1000, 100000),
            'currency'    => fake()->randomElement(['EGP', 'USD', 'SAR']),
            'status'      => fake()->randomElement(Invoice::STATUSES),
            'due_date'    => fake()->dateTimeBetween('now', '+6 months'),
            'paid_date'   => fake()->optional(0.3)->dateTimeBetween('-1 month', 'now'),
        ];
    }
}
