<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ProjectPolicy
{
    public function viewAny(User $user): Response
    {
        return $user->canAccess('projects')
            ? Response::allow()
            : Response::deny('ليس لديك صلاحية لعرض المشاريع');
    }

    public function view(User $user, Project $project): Response
    {
        return $user->canAccess('projects')
            ? Response::allow()
            : Response::deny('ليس لديك صلاحية لعرض هذا المشروع');
    }

    public function create(User $user): Response
    {
        return $user->canAccess('projects')
            ? Response::allow()
            : Response::deny('ليس لديك صلاحية لإنشاء مشاريع');
    }

    public function update(User $user, Project $project): Response
    {
        return $user->canAccess('projects')
            ? Response::allow()
            : Response::deny('ليس لديك صلاحية لتعديل هذا المشروع');
    }

    public function delete(User $user, Project $project): Response
    {
        return $user->hasRole(['super_admin', 'manager', 'marketing_manager'])
            ? Response::allow()
            : Response::deny('حذف المشاريع متاح فقط للمديرين. تواصل مع المدير إذا كنت تحتاج لحذف هذا المشروع.');
    }
}
