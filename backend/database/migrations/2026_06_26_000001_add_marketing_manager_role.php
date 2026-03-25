<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','manager','accountant','sales','employee','marketing_manager') NOT NULL DEFAULT 'employee'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','manager','accountant','sales','employee') NOT NULL DEFAULT 'employee'");
    }
};
