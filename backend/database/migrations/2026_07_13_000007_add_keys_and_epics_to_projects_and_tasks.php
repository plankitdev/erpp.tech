<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds Jira-style issue keys and epic linkage:
 *   - projects.key           short prefix shown in task keys (e.g. MADAR)
 *   - projects.task_counter  per-project running counter used to mint task numbers
 *   - tasks.epic_id          optional epic the task belongs to
 *   - tasks.number           per-project sequential number → key = "{project.key}-{number}"
 *   - tasks.board_order      manual ordering for the board / backlog
 *
 * The up() also backfills existing rows so every current task gets a stable key,
 * generated generically from the project name (works for any company).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('key', 12)->nullable()->after('slug');
            $table->unsignedInteger('task_counter')->default(0)->after('key');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('epic_id')->nullable()->after('project_id')->constrained()->nullOnDelete();
            $table->unsignedInteger('number')->nullable()->after('epic_id');
            $table->integer('board_order')->default(0)->after('number');
        });

        $this->backfill();
    }

    /**
     * Give every existing project a unique per-company key and number its tasks.
     */
    private function backfill(): void
    {
        // Includes soft-deleted rows (raw queries bypass global scopes) so counters
        // stay monotonic and no future task reuses an old number.
        $projects = DB::table('projects')->orderBy('company_id')->orderBy('id')->get();

        $usedKeys = []; // company_id => [keys already taken]

        foreach ($projects as $project) {
            $letters = strtoupper(preg_replace('/[^A-Za-z]/', '', (string) $project->name));
            $base = $letters !== '' ? substr($letters, 0, 5) : 'PRJ';

            $companyUsed = $usedKeys[$project->company_id] ?? [];
            $key = $base;
            $i = 1;
            while (in_array($key, $companyUsed, true)) {
                $key = $base . $i++;
            }
            $companyUsed[] = $key;
            $usedKeys[$project->company_id] = $companyUsed;

            // Number this project's tasks in creation order.
            $tasks = DB::table('tasks')->where('project_id', $project->id)->orderBy('id')->get();
            $n = 0;
            foreach ($tasks as $task) {
                $n++;
                DB::table('tasks')->where('id', $task->id)->update([
                    'number'      => $n,
                    'board_order' => $n,
                ]);
            }

            DB::table('projects')->where('id', $project->id)->update([
                'key'          => $key,
                'task_counter' => $n,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['epic_id']);
            $table->dropColumn(['epic_id', 'number', 'board_order']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['key', 'task_counter']);
        });
    }
};
