<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->date('last_contact_date')->nullable()->after('notes');
            $table->integer('follow_up_days')->default(30)->after('last_contact_date');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['last_contact_date', 'follow_up_days']);
        });
    }
};
