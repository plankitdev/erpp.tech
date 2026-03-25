<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccess('tasks') || $user->canAccess('tasks.own');
    }

    public function view(User $user, Task $task): bool
    {
        if ($user->canAccess('tasks')) {
            return true;
        }

        return $user->canAccess('tasks.own') && $task->assigned_to === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->canAccess('tasks');
    }

    public function update(User $user, Task $task): bool
    {
        if ($user->canAccess('tasks')) {
            return true;
        }

        return $user->canAccess('tasks.own') && $task->assigned_to === $user->id;
    }

    public function delete(User $user, Task $task): bool
    {
        return $user->hasRole(['super_admin', 'manager', 'marketing_manager']);
    }

    public function deleteAny(User $user): bool
    {
        return $user->hasRole(['super_admin', 'manager', 'marketing_manager']);
    }
}
