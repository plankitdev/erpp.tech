<?php

namespace App\Console\Commands;

use App\Models\Task;
use Illuminate\Console\Command;

class ProcessRecurringTasks extends Command
{
    protected $signature = 'tasks:process-recurring';
    protected $description = 'إنشاء مهام جديدة من المهام المتكررة';

    public function handle(): int
    {
        $count = 0;

        $tasks = Task::where('recurrence', '!=', Task::RECURRENCE_NONE)
            ->whereNotNull('next_recurrence_date')
            ->whereDate('next_recurrence_date', '<=', now())
            ->get();

        foreach ($tasks as $task) {
            $newTask = $task->replicate(['id', 'created_at', 'updated_at']);
            $newTask->status = Task::STATUS_TODO;
            $newTask->due_date = $task->next_recurrence_date;
            $newTask->start_date = $task->next_recurrence_date;
            $newTask->next_recurrence_date = null;
            $newTask->recurrence = Task::RECURRENCE_NONE;
            $newTask->save();

            // Update next recurrence date on the original task
            $nextDate = match ($task->recurrence) {
                Task::RECURRENCE_DAILY   => $task->next_recurrence_date->addDay(),
                Task::RECURRENCE_WEEKLY  => $task->next_recurrence_date->addWeek(),
                Task::RECURRENCE_MONTHLY => $task->next_recurrence_date->addMonth(),
                default => null,
            };

            $task->update(['next_recurrence_date' => $nextDate]);
            $count++;
        }

        $this->info("تم إنشاء {$count} مهمة متكررة");
        return self::SUCCESS;
    }
}
