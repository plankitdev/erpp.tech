<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Line items stored as JSON (same lightweight pattern as quotations)
        Schema::table('invoices', function (Blueprint $table) {
            $table->json('items')->nullable()->after('amount');
        });

        // Add draft/sent to the invoice workflow statuses
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('draft','sent','pending','paid','overdue','partial') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        // Revert any draft/sent rows to pending so the narrower enum still fits
        DB::statement("UPDATE invoices SET status = 'pending' WHERE status IN ('draft','sent')");
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('pending','paid','overdue','partial') NOT NULL DEFAULT 'pending'");

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('items');
        });
    }
};
