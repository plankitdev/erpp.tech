<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('treasury_transactions', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->after('category')->constrained()->nullOnDelete();
            $table->foreignId('employee_id')->nullable()->after('project_id')->constrained()->nullOnDelete();
            $table->foreignId('client_id')->nullable()->after('employee_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('treasury_transactions', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropForeign(['employee_id']);
            $table->dropForeign(['client_id']);
            $table->dropColumn(['project_id', 'employee_id', 'client_id']);
        });
    }
};
