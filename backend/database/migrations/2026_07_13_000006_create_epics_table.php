<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Epics — a lightweight grouping layer above tasks (Jira-style).
 * An epic belongs to a project and gathers related tasks under one umbrella.
 * Generic for any company: purely optional structure, no company-specific logic.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('epics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('color', 20)->default('#6366f1');
            $table->enum('status', ['open', 'in_progress', 'done'])->default('open');
            $table->integer('sort_order')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('company_id');
            $table->index('project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('epics');
    }
};
