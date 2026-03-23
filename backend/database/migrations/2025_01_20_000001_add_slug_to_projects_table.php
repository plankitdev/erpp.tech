<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('projects', 'slug')) {
            return;
        }

        if (!Schema::hasTable('projects')) {
            return;
        }

        Schema::table('projects', function (Blueprint $table) {
            $table->string('slug')->unique()->after('name');
        });

        // Generate slugs for existing projects
        foreach (\App\Models\Project::withoutGlobalScopes()->get() as $project) {
            $baseSlug = Str::slug($project->name) ?: 'project';
            $slug = $baseSlug;
            $counter = 1;
            while (\App\Models\Project::withoutGlobalScopes()->where('slug', $slug)->where('id', '!=', $project->id)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }
            $project->updateQuietly(['slug' => $slug]);
        }
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
