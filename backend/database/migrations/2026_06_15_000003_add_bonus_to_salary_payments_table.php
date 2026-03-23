<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_payments', function (Blueprint $table) {
            $table->decimal('bonus', 12, 2)->default(0)->after('base_salary');
            $table->string('bonus_reason')->nullable()->after('bonus');
        });
    }

    public function down(): void
    {
        Schema::table('salary_payments', function (Blueprint $table) {
            $table->dropColumn(['bonus', 'bonus_reason']);
        });
    }
};
