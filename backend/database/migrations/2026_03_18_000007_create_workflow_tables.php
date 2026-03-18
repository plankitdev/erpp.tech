<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('trigger'); // lead_converted, contract_expiring, contract_expired, invoice_overdue, invoice_paid, task_completed
            $table->json('conditions')->nullable(); // e.g. {"days_before": 7}
            $table->string('action'); // create_invoice, create_task, send_notification, update_status
            $table->json('action_config')->nullable(); // action-specific config
            $table->boolean('is_active')->default(true);
            $table->integer('executions_count')->default(0);
            $table->timestamp('last_executed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('workflow_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('workflow_rule_id')->constrained()->cascadeOnDelete();
            $table->string('trigger');
            $table->string('action');
            $table->string('status'); // success, failed
            $table->string('entity_type')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->text('result')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_logs');
        Schema::dropIfExists('workflow_rules');
    }
};
