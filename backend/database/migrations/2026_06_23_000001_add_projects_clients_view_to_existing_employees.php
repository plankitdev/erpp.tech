<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('role', 'employee')
            ->get()
            ->each(function ($user) {
                $perms = json_decode($user->permissions, true);

                if (!is_array($perms) || count($perms) === 0) {
                    return;
                }

                $changed = false;

                if (!in_array('projects.view', $perms)) {
                    $perms[] = 'projects.view';
                    $changed = true;
                }

                if (!in_array('clients.view', $perms)) {
                    $perms[] = 'clients.view';
                    $changed = true;
                }

                if ($changed) {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['permissions' => json_encode($perms)]);
                }
            });
    }

    public function down(): void
    {
        // Not reversible - permissions may have been manually added
    }
};
