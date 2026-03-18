<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('EGP');
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->date('payment_date');
            $table->enum('type', ['profit_share', 'advance', 'expense', 'withdrawal'])->default('profit_share');
            $table->text('notes')->nullable();
            $table->string('receipt_file')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'partner_id']);
            $table->index(['month', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_payments');
    }
};
