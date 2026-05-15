<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('type', 50); // task_overdue, contract_expiring, invoice_unpaid, client_inactive, task_stuck
            $table->morphs('followable'); // Task, Contract, Invoice, Client
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->default('pending'); // pending, in_progress, resolved, dismissed
            $table->string('priority', 20)->default('medium'); // low, medium, high, critical
            $table->text('note')->nullable();
            $table->datetime('due_date');
            $table->datetime('resolved_at')->nullable();
            $table->boolean('auto_generated')->default(false);
            $table->timestamps();

            $table->index(['company_id', 'status']);
            $table->index(['assigned_to', 'status']);
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('follow_ups');
    }
};
