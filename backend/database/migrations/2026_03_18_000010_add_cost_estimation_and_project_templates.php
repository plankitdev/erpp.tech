<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add cost estimation to projects
        Schema::table('projects', function (Blueprint $table) {
            $table->decimal('estimated_cost', 12, 2)->nullable()->after('budget');
            $table->decimal('actual_cost', 12, 2)->default(0)->after('estimated_cost');
        });

        // Project templates
        Schema::create('project_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('default_tasks')->nullable();
            $table->decimal('estimated_budget', 12, 2)->nullable();
            $table->string('currency', 3)->default('EGP');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['estimated_cost', 'actual_cost']);
        });
        Schema::dropIfExists('project_templates');
    }
};
