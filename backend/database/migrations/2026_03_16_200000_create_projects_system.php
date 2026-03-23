<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Projects table
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', ['active', 'completed', 'on_hold', 'cancelled'])->default('active');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->decimal('budget', 12, 2)->nullable();
            $table->string('currency', 3)->default('EGP');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('company_id');
            $table->index('client_id');
        });

        // Add project_id, parent_id, recurrence to tasks
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->after('client_id')->constrained()->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->after('project_id')->constrained('tasks')->cascadeOnDelete();
            $table->enum('recurrence', ['none', 'daily', 'weekly', 'monthly'])->default('none')->after('priority');
            $table->date('next_recurrence_date')->nullable()->after('recurrence');
        });

        // Pivot table for multi-assignee tasks
        Schema::create('task_assignees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['task_id', 'user_id']);
        });

        // Project files
        Schema::create('project_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_files');
        Schema::dropIfExists('task_assignees');
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['project_id', 'parent_id', 'recurrence', 'next_recurrence_date']);
        });
        Schema::dropIfExists('projects');
    }
};
