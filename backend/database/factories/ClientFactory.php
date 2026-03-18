<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        return [
            'company_id'   => Company::factory(),
            'name'         => fake()->name(),
            'phone'        => fake()->phoneNumber(),
            'company_name' => fake()->company(),
            'sector'       => fake()->randomElement(['تكنولوجيا', 'تجارة', 'صناعة', 'خدمات']),
            'service'      => fake()->randomElement(['تصميم', 'تطوير', 'تسويق', 'استشارات']),
            'status'       => fake()->randomElement(Client::STATUSES),
            'notes'        => fake()->optional()->sentence(),
        ];
    }
}
