<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->decimal('base_salary', 12, 2);
            $table->decimal('deductions', 12, 2)->default(0);
            $table->string('deduction_reason')->nullable();
            $table->decimal('total', 12, 2);
            $table->decimal('transfer_amount', 12, 2)->default(0);
            $table->decimal('remaining', 12, 2)->default(0);
            $table->date('payment_date');
            $table->timestamps();

            $table->unique(['employee_id', 'month', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_payments');
    }
};
