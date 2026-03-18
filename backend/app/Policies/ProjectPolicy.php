<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->canAccess('projects');
    }

    public function view(User $user, Project $project): bool
    {
        return $user->canAccess('projects');
    }

    public function create(User $user): bool
    {
        return $user->canAccess('projects');
    }

    public function update(User $user, Project $project): bool
    {
        return $user->canAccess('projects');
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->hasRole(['super_admin', 'manager']);
    }
}
