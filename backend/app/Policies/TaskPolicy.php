<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TaskPolicy
{
    public function viewAny(User $user): Response
    {
        return ($user->canAccess('tasks') || $user->canAccess('tasks.own'))
            ? Response::allow()
            : Response::deny('ليس لديك صلاحية لعرض المهام');
    }

    public function view(User $user, Task $task): Response
    {
        if ($user->canAccess('tasks')) {
            return Response::allow();
        }

        return ($user->canAccess('tasks.own') && $task->assigned_to === $user->id)
            ? Response::allow()
            : Response::deny('ليس لديك صلاحية لعرض هذه المهمة');
    }

    public function create(User $user): Response
    {
        return $user->canAccess('tasks')
            ? Response::allow()
            : Response::deny('ليس لديك صلاحية لإنشاء مهام');
    }

    public function update(User $user, Task $task): Response
    {
        if ($user->canAccess('tasks')) {
            return Response::allow();
        }

        return ($user->canAccess('tasks.own') && $task->assigned_to === $user->id)
            ? Response::allow()
            : Response::deny('ليس لديك صلاحية لتعديل هذه المهمة');
    }

    public function delete(User $user, Task $task): Response
    {
        return $user->hasRole(['super_admin', 'manager', 'marketing_manager'])
            ? Response::allow()
            : Response::deny('حذف المهام متاح فقط للمديرين. تواصل مع المدير إذا كنت تحتاج لحذف هذه المهمة.');
    }

    public function deleteAny(User $user): Response
    {
        return $user->hasRole(['super_admin', 'manager', 'marketing_manager'])
            ? Response::allow()
            : Response::deny('حذف المهام متاح فقط للمديرين.');
    }
}
