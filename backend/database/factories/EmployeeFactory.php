<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        return [
            'company_id'  => Company::factory(),
            'user_id'     => User::factory(),
            'name'        => fake()->name(),
            'position'    => fake()->jobTitle(),
            'base_salary' => fake()->randomFloat(2, 3000, 30000),
            'join_date'   => fake()->dateTimeBetween('-3 years', 'now'),
        ];
    }
}
