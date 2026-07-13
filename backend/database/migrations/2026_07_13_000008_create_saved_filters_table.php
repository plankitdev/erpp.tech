<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Saved filters — per-user reusable filter presets for the task board and lists.
 * `criteria` is a free-form JSON blob (status/assignee/priority/project/epic/group-by),
 * so the same table serves any view via the `scope` discriminator.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_filters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('scope')->default('tasks');
            $table->json('criteria');
            $table->boolean('is_shared')->default(false);
            $table->timestamps();

            $table->index(['company_id', 'user_id']);
            $table->index('scope');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_filters');
    }
};
