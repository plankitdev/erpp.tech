<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * A previous migration (add_marketing_manager_role) accidentally dropped
     * 'company_admin' from the users.role enum even though the codebase relies
     * on it heavily. This restores the full set of roles.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','company_admin','manager','marketing_manager','accountant','sales','employee') NOT NULL DEFAULT 'employee'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','manager','accountant','sales','employee','marketing_manager') NOT NULL DEFAULT 'employee'");
    }
};
