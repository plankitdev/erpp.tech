<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('vat_rate', 5, 2)->default(0)->after('amount');
            $table->decimal('vat_amount', 12, 2)->default(0)->after('vat_rate');
            $table->decimal('total_with_vat', 12, 2)->nullable()->after('vat_amount');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['vat_rate', 'vat_amount', 'total_with_vat']);
        });
    }
};
