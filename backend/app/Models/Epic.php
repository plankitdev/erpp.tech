<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Epic extends Model
{
    use HasCompany, HasFactory, LogsActivity, SoftDeletes;

    public const STATUS_OPEN        = 'open';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_DONE        = 'done';
    public const STATUSES = [
        self::STATUS_OPEN,
        self::STATUS_IN_PROGRESS,
        self::STATUS_DONE,
    ];

    protected $fillable = [
        'company_id', 'project_id', 'title', 'description',
        'color', 'status', 'sort_order', 'created_by',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function getTasksCountAttribute(): int
    {
        return $this->tasks()->count();
    }

    public function getCompletedTasksCountAttribute(): int
    {
        return $this->tasks()->where('status', Task::STATUS_DONE)->count();
    }

    public function getProgressAttribute(): int
    {
        $total = $this->tasks_count;
        if ($total === 0) return 0;
        return (int) round(($this->completed_tasks_count / $total) * 100);
    }
}
