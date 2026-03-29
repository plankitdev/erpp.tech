<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'company_admin', 'manager', 'marketing_manager', 'accountant', 'sales', 'employee') DEFAULT 'employee'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'manager', 'marketing_manager', 'accountant', 'sales', 'employee') DEFAULT 'employee'");
    }
};
