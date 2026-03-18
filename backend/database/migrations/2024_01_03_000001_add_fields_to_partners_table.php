<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('name');
            $table->string('bank_account')->nullable()->after('phone');
            $table->boolean('is_active')->default(true)->after('share_percentage');
        });
    }

    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropColumn(['phone', 'bank_account', 'is_active']);
        });
    }
};
