<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountManagerController extends Controller
{
    use ApiResponse;

    /**
     * لوحة الأكونت مانجر الرئيسية
     */
    public function overview(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();

        // ============ مهام عاجلة اليوم ============
        $urgentToday = Task::with(['assignedUser', 'project'])
            ->where(function ($q) use ($today) {
                $q->where('due_date', $today)
                  ->orWhere(function ($q2) {
                      $q2->where('due_date', '<', now())
                         ->whereNotIn('status', ['done']);
                  });
            })
            ->whereNotIn('status', ['done'])
            ->whereNull('parent_id')
            ->orderByRaw("FIELD(priority,'high','medium','low')")
            ->orderBy('due_date')
            ->limit(15)
            ->get()
            ->map(fn($t) => [
                'id'           => $t->id,
                'title'        => $t->title,
                'priority'     => $t->priority,
                'status'       => $t->status,
                'due_date'     => $t->due_date,
                'is_overdue'   => $t->due_date && $t->due_date < now(),
                'assignee'     => $t->assignedUser ? ['id' => $t->assignedUser->id, 'name' => $t->assignedUser->name] : null,
                'project'      => $t->project ? ['id' => $t->project->id, 'name' => $t->project->name, 'slug' => $t->project->slug] : null,
            ]);

        // ============ المشاريع النشطة ============
        $activeProjects = Project::with(['tasks', 'client'])
            ->where('status', Project::STATUS_ACTIVE)
            ->orderBy('end_date')
            ->get()
            ->map(function ($p) {
                $tasks        = $p->tasks;
                $total        = $tasks->count();
                $done         = $tasks->where('status', 'done')->count();
                $overdue      = $tasks->where('status', '!=', 'done')
                                      ->filter(fn($t) => $t->due_date && $t->due_date < now())
                                      ->count();
                $inReview     = $tasks->where('status', 'review')->count();
                $progress     = $total > 0 ? round(($done / $total) * 100) : 0;
                $daysLeft     = $p->end_date ? now()->diffInDays($p->end_date, false) : null;

                return [
                    'id'           => $p->id,
                    'name'         => $p->name,
                    'slug'         => $p->slug,
                    'client'       => $p->client ? $p->client->name : null,
                    'status'       => $p->status,
                    'progress'     => $progress,
                    'total_tasks'  => $total,
                    'done_tasks'   => $done,
                    'overdue_tasks'=> $overdue,
                    'review_tasks' => $inReview,
                    'days_left'    => $daysLeft,
                    'end_date'     => $p->end_date,
                    'is_late'      => $daysLeft !== null && $daysLeft < 0,
                ];
            });

        // ============ تحميل الشغل على التيم (optimized: 3 queries بدل N query) ============
        $teamMembers = User::where('company_id', $user->company_id)
            ->whereNotIn('role', ['super_admin'])
            ->get(['id', 'name', 'role']);

        $memberIds = $teamMembers->pluck('id')->all();

        // جلب كل المهام المفتوحة مرة واحدة (assigned_to)
        $allOpenTasks = Task::whereNotIn('status', ['done'])
            ->whereNull('parent_id')
            ->whereIn('assigned_to', $memberIds)
            ->get(['id', 'assigned_to', 'status', 'due_date']);

        // جلب المهام من pivot table (multi-assignee) مرة واحدة
        $pivotRows = DB::table('task_assignees')
            ->whereIn('user_id', $memberIds)
            ->whereIn('task_id', Task::whereNotIn('status', ['done'])->whereNull('parent_id')->pluck('id'))
            ->get(['task_id', 'user_id']);

        // دمج المهام لكل عضو (merge assigned_to + pivot)
        $tasksByUser = $allOpenTasks->groupBy('assigned_to');

        $teamWorkload = $teamMembers->map(function ($member) use ($tasksByUser, $pivotRows, $allOpenTasks) {
            $direct  = $tasksByUser->get($member->id, collect());
            $pivotIds = $pivotRows->where('user_id', $member->id)->pluck('task_id');
            $pivotTasks = $allOpenTasks->whereIn('id', $pivotIds->all());
            $tasks  = $direct->merge($pivotTasks)->unique('id');

            $overdue    = $tasks->filter(fn($t) => $t->due_date && $t->due_date < now())->count();
            $review     = $tasks->where('status', 'review')->count();
            $inProgress = $tasks->where('status', 'in_progress')->count();
            $todo       = $tasks->where('status', 'todo')->count();

            return [
                'id'          => $member->id,
                'name'        => $member->name,
                'role'        => $member->role,
                'total_open'  => $tasks->count(),
                'overdue'     => $overdue,
                'in_review'   => $review,
                'in_progress' => $inProgress,
                'todo'        => $todo,
            ];
        })->sortByDesc('total_open')->values();

        // ============ المهام في مرحلة مراجعة ============
        $pendingReview = Task::with(['assignedUser', 'project', 'creator'])
            ->where('status', Task::STATUS_REVIEW)
            ->whereNull('parent_id')
            ->orderBy('updated_at', 'desc')
            ->limit(20)
            ->get()
            ->map(fn($t) => [
                'id'        => $t->id,
                'title'     => $t->title,
                'priority'  => $t->priority,
                'due_date'  => $t->due_date,
                'updated_at'=> $t->updated_at,
                'assignee'  => $t->assignedUser ? ['id' => $t->assignedUser->id, 'name' => $t->assignedUser->name] : null,
                'creator'   => $t->creator ? ['id' => $t->creator->id, 'name' => $t->creator->name] : null,
                'project'   => $t->project ? ['id' => $t->project->id, 'name' => $t->project->name, 'slug' => $t->project->slug] : null,
            ]);

        // ============ المهام المتكررة اليوم ============
        $recurringToday = Task::with(['assignedUser'])
            ->where('recurrence', '!=', 'none')
            ->whereNotIn('status', ['done'])
            ->whereNull('parent_id')
            ->orderByRaw("FIELD(priority,'high','medium','low')")
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'id'         => $t->id,
                'title'      => $t->title,
                'recurrence' => $t->recurrence,
                'priority'   => $t->priority,
                'status'     => $t->status,
                'assignee'   => $t->assignedUser ? ['id' => $t->assignedUser->id, 'name' => $t->assignedUser->name] : null,
            ]);

        // ============ إحصائيات سريعة ============
        $stats = [
            'total_active_projects'  => Project::where('status', 'active')->count(),
            'total_open_tasks'       => Task::whereNotIn('status', ['done'])->whereNull('parent_id')->count(),
            'overdue_tasks'          => Task::whereNotIn('status', ['done'])->whereNull('parent_id')->where('due_date', '<', now())->count(),
            'pending_review'         => Task::where('status', 'review')->whereNull('parent_id')->count(),
            'done_today'             => Task::where('status', 'done')->whereDate('updated_at', $today)->count(),
            'team_members'           => $teamMembers->count(),
        ];

        return $this->successResponse([
            'stats'          => $stats,
            'urgent_today'   => $urgentToday,
            'active_projects'=> $activeProjects,
            'team_workload'  => $teamWorkload,
            'pending_review' => $pendingReview,
            'recurring'      => $recurringToday,
        ]);
    }

    /**
     * مهام عضو تيم محدد
     */
    public function weeklyReport(Request $request): JsonResponse
    {
        $startOfWeek = now()->startOfWeek();
        $endOfWeek   = now()->endOfWeek();
        $companyId   = $request->user()->company_id;

        $members   = User::where('company_id', $companyId)->whereNotIn('role', ['super_admin'])->get(['id', 'name', 'role']);
        $memberIds = $members->pluck('id')->all();

        $completedThisWeek = Task::whereIn('assigned_to', $memberIds)
            ->where('status', 'done')
            ->whereBetween('updated_at', [$startOfWeek, $endOfWeek])
            ->whereNull('parent_id')
            ->get(['id', 'assigned_to', 'title', 'priority', 'updated_at']);

        $createdThisWeek = Task::whereIn('assigned_to', $memberIds)
            ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
            ->whereNull('parent_id')
            ->get(['id', 'assigned_to', 'priority', 'status']);

        $overdueNow = Task::whereIn('assigned_to', $memberIds)
            ->whereNotIn('status', ['done'])
            ->where('due_date', '<', now())
            ->whereNull('parent_id')
            ->get(['id', 'assigned_to', 'title', 'priority', 'due_date']);

        $report = $members->map(function ($member) use ($completedThisWeek, $createdThisWeek, $overdueNow) {
            $done    = $completedThisWeek->where('assigned_to', $member->id);
            $created = $createdThisWeek->where('assigned_to', $member->id);
            $overdue = $overdueNow->where('assigned_to', $member->id);
            return [
                'id'              => $member->id,
                'name'            => $member->name,
                'role'            => $member->role,
                'completed_count' => $done->count(),
                'created_count'   => $created->count(),
                'overdue_count'   => $overdue->count(),
                'completed_tasks' => $done->map(fn($t) => ['id' => $t->id, 'title' => $t->title, 'priority' => $t->priority])->values(),
                'overdue_tasks'   => $overdue->map(fn($t) => ['id' => $t->id, 'title' => $t->title, 'priority' => $t->priority, 'due_date' => $t->due_date])->values(),
            ];
        })->sortByDesc('completed_count')->values();

        return $this->successResponse([
            'week_start'        => $startOfWeek->toDateString(),
            'week_end'          => $endOfWeek->toDateString(),
            'company_completed' => $completedThisWeek->count(),
            'company_created'   => $createdThisWeek->count(),
            'members'           => $report,
        ]);
    }

    public function clientReport(Request $request, int $clientId): JsonResponse
    {
        $client = Client::findOrFail($clientId);

        $projects = Project::with('tasks')->where('client_id', $clientId)->get()->map(function ($p) {
            $tasks    = $p->tasks;
            $total    = $tasks->count();
            $done     = $tasks->where('status', 'done')->count();
            $overdue  = $tasks->where('status', '!=', 'done')->filter(fn($t) => $t->due_date && $t->due_date < now())->count();
            return [
                'id'          => $p->id,
                'name'        => $p->name,
                'slug'        => $p->slug,
                'status'      => $p->status,
                'progress'    => $total > 0 ? round(($done / $total) * 100) : 0,
                'total_tasks' => $total,
                'done_tasks'  => $done,
                'overdue'     => $overdue,
                'end_date'    => $p->end_date,
            ];
        });

        $tasks = Task::where('client_id', $clientId)
            ->whereNull('parent_id')
            ->get(['id', 'title', 'status', 'priority', 'due_date', 'project_id']);

        $byStatus = [
            'todo'        => $tasks->where('status', 'todo')->count(),
            'in_progress' => $tasks->where('status', 'in_progress')->count(),
            'review'      => $tasks->where('status', 'review')->count(),
            'done'        => $tasks->where('status', 'done')->count(),
        ];

        return $this->successResponse([
            'client'    => ['id' => $client->id, 'name' => $client->name],
            'projects'  => $projects->values(),
            'by_status' => $byStatus,
            'total'     => $tasks->count(),
        ]);
    }

    /**
     * مهام عضو تيم محدد
     */
    public function memberTasks(Request $request, int $userId): JsonResponse
    {
        $tasks = Task::with(['project', 'client'])
            ->where(function ($q) use ($userId) {
                $q->where('assigned_to', $userId)
                  ->orWhereHas('assignees', fn($q2) => $q2->where('user_id', $userId));
            })
            ->whereNotIn('status', ['done'])
            ->whereNull('parent_id')
            ->orderByRaw("FIELD(priority,'high','medium','low')")
            ->orderBy('due_date')
            ->get()
            ->map(fn($t) => [
                'id'        => $t->id,
                'title'     => $t->title,
                'priority'  => $t->priority,
                'status'    => $t->status,
                'due_date'  => $t->due_date,
                'is_overdue'=> $t->due_date && $t->due_date < now(),
                'project'   => $t->project ? ['id' => $t->project->id, 'name' => $t->project->name, 'slug' => $t->project->slug] : null,
            ]);

        return $this->successResponse($tasks);
    }
}
