<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->enum('source', ['ad', 'referral', 'website', 'social', 'other'])->default('other');
            $table->enum('service_type', ['marketing', 'design', 'moderation', 'development', 'other'])->default('other');
            $table->decimal('expected_budget', 12, 2)->nullable();
            $table->enum('stage', ['new', 'first_contact', 'proposal_sent', 'negotiation', 'contract_signed'])->default('new');
            $table->date('first_contact_date')->nullable();
            $table->date('last_followup_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('proposal_file')->nullable();
            $table->decimal('proposed_amount', 12, 2)->nullable();
            $table->decimal('final_amount', 12, 2)->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('converted_client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_id', 'stage']);
            $table->index(['company_id', 'assigned_to']);
        });

        Schema::create('lead_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['call', 'message', 'email', 'proposal_sent', 'meeting', 'followup']);
            $table->text('notes')->nullable();
            $table->string('attachment')->nullable();
            $table->enum('outcome', ['positive', 'neutral', 'negative'])->nullable();
            $table->date('next_followup_date')->nullable();
            $table->timestamps();

            $table->index('lead_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_activities');
        Schema::dropIfExists('leads');
    }
};
