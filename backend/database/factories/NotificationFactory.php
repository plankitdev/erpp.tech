<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'user_id'    => User::factory(),
            'type'       => fake()->randomElement([
                Notification::TYPE_INVOICE_OVERDUE,
                Notification::TYPE_TASK_ASSIGNED,
                Notification::TYPE_FILE_SENT,
                Notification::TYPE_SALARY_PAID,
            ]),
            'title'      => fake()->sentence(4),
            'body'       => fake()->optional()->sentence(),
            'link'       => fake()->optional()->randomElement(['/invoices', '/tasks', '/salaries']),
            'read_at'    => fake()->optional(0.5)->dateTimeBetween('-1 week', 'now'),
        ];
    }

    public function unread(): static
    {
        return $this->state(fn() => ['read_at' => null]);
    }
}
