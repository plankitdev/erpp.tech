<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\HasTags;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasCompany, HasFactory, HasTags;

    public const STATUS_TODO        = 'todo';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_REVIEW      = 'review';
    public const STATUS_DONE        = 'done';
    public const STATUSES = [
        self::STATUS_TODO,
        self::STATUS_IN_PROGRESS,
        self::STATUS_REVIEW,
        self::STATUS_DONE,
    ];

    public const PRIORITY_LOW    = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH   = 'high';
    public const PRIORITIES = [
        self::PRIORITY_LOW,
        self::PRIORITY_MEDIUM,
        self::PRIORITY_HIGH,
    ];

    public const RECURRENCE_NONE    = 'none';
    public const RECURRENCE_DAILY   = 'daily';
    public const RECURRENCE_WEEKLY  = 'weekly';
    public const RECURRENCE_MONTHLY = 'monthly';

    protected $fillable = [
        'company_id', 'title', 'description', 'assigned_to',
        'created_by', 'status', 'priority', 'due_date', 'start_date', 'client_id',
        'project_id', 'parent_id', 'recurrence', 'next_recurrence_date',
    ];

    protected $casts = [
        'due_date'              => 'datetime:Y-m-d',
        'start_date'            => 'datetime:Y-m-d',
        'next_recurrence_date'  => 'datetime:Y-m-d',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_id');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_assignees')->withTimestamps();
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class);
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(TaskChecklist::class)->orderBy('sort_order');
    }

    public function files(): HasMany
    {
        return $this->hasMany(TaskFile::class);
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function getTotalTimeAttribute(): int
    {
        return $this->timeEntries()->sum('duration_minutes');
    }

    public function getChecklistProgressAttribute(): array
    {
        $total = $this->checklists()->count();
        $completed = $this->checklists()->where('is_completed', true)->count();
        return ['total' => $total, 'completed' => $completed];
    }

    public function isRecurring(): bool
    {
        return $this->recurrence !== self::RECURRENCE_NONE;
    }

    public function getSubtasksCountAttribute(): int
    {
        return $this->subtasks()->count();
    }

    public function getCompletedSubtasksCountAttribute(): int
    {
        return $this->subtasks()->where('status', self::STATUS_DONE)->count();
    }
}
