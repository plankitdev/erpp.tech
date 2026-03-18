<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'company_id'  => Company::factory(),
            'title'       => fake()->sentence(4),
            'description' => fake()->optional()->paragraph(),
            'assigned_to' => User::factory(),
            'created_by'  => User::factory(),
            'status'      => fake()->randomElement(Task::STATUSES),
            'priority'    => fake()->randomElement(Task::PRIORITIES),
            'due_date'    => fake()->optional()->dateTimeBetween('now', '+3 months'),
        ];
    }
}
