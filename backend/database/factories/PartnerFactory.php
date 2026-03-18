<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Partner;
use Illuminate\Database\Eloquent\Factories\Factory;

class PartnerFactory extends Factory
{
    protected $model = Partner::class;

    public function definition(): array
    {
        return [
            'company_id'       => Company::factory(),
            'name'             => fake()->name(),
            'share_percentage' => fake()->randomFloat(2, 5, 50),
        ];
    }
}
