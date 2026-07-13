<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\HasTags;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class Project extends Model
{
    use HasCompany, HasFactory, HasTags, LogsActivity, SoftDeletes;

    public const STATUS_ACTIVE    = 'active';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_ON_HOLD   = 'on_hold';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_COMPLETED,
        self::STATUS_ON_HOLD,
        self::STATUS_CANCELLED,
    ];

    protected $fillable = [
        'company_id', 'name', 'slug', 'key', 'description', 'client_id',
        'status', 'start_date', 'end_date', 'budget', 'estimated_cost', 'actual_cost', 'currency', 'created_by',
    ];

    protected $casts = [
        'start_date' => 'datetime:Y-m-d',
        'end_date'   => 'datetime:Y-m-d',
        'budget'     => 'decimal:2',
        'estimated_cost' => 'decimal:2',
        'actual_cost'    => 'decimal:2',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Normalise the issue-key prefix: uppercase, alphanumerics only.
     */
    public function setKeyAttribute($value): void
    {
        $clean = $value ? strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $value)) : null;
        $this->attributes['key'] = $clean !== '' ? $clean : null;
    }

    /**
     * Build a unique-per-company key prefix from a project name.
     * Falls back to "PRJ" for names without Latin letters (e.g. Arabic-only names).
     */
    public static function generateKey(string $name, ?int $companyId): string
    {
        $letters = strtoupper(preg_replace('/[^A-Za-z]/', '', $name));
        $base = $letters !== '' ? substr($letters, 0, 5) : 'PRJ';

        $key = $base;
        $i = 1;
        while (static::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('key', $key)
            ->exists()) {
            $key = $base . $i++;
        }
        return $key;
    }

    /**
     * Atomically reserve and return the next per-project task number.
     * A row lock inside a transaction guarantees no two concurrent creates
     * ever mint the same number.
     */
    public function nextTaskNumber(): int
    {
        return DB::transaction(function () {
            $current = (int) (DB::table('projects')
                ->where('id', $this->id)
                ->lockForUpdate()
                ->value('task_counter') ?? 0);
            $next = $current + 1;
            DB::table('projects')->where('id', $this->id)->update(['task_counter' => $next]);
            $this->task_counter = $next;
            return $next;
        });
    }

    protected static function booted(): void
    {
        static::creating(function (Project $project) {
            if (empty($project->slug)) {
                $baseSlug = Str::slug($project->name) ?: 'project';
                $slug = $baseSlug;
                $counter = 1;
                while (static::withoutGlobalScopes()->where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $counter++;
                }
                $project->slug = $slug;
            }

            // Auto-generate an issue-key prefix (company_id already set by HasCompany).
            if (empty($project->key)) {
                $project->key = static::generateKey($project->name, $project->company_id);
            }
        });

        static::updating(function (Project $project) {
            if ($project->isDirty('name') && !$project->isDirty('slug')) {
                $baseSlug = Str::slug($project->name) ?: 'project';
                $slug = $baseSlug;
                $counter = 1;
                while (static::withoutGlobalScopes()->where('slug', $slug)->where('id', '!=', $project->id)->exists()) {
                    $slug = $baseSlug . '-' . $counter++;
                }
                $project->slug = $slug;
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function epics(): HasMany
    {
        return $this->hasMany(Epic::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(ProjectFile::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function meetings(): HasMany
    {
        return $this->hasMany(Meeting::class);
    }

    public function getTotalTimeAttribute(): int
    {
        return $this->timeEntries()->sum('duration_minutes');
    }

    public function getTotalExpensesAttribute(): float
    {
        return (float) $this->expenses()->sum('amount');
    }

    // Stats
    public function getTasksCountAttribute(): int
    {
        return $this->tasks()->count();
    }

    public function getCompletedTasksCountAttribute(): int
    {
        return $this->tasks()->where('status', 'done')->count();
    }

    public function getProgressAttribute(): int
    {
        $total = $this->tasks_count;
        if ($total === 0) return 0;
        return (int) round(($this->completed_tasks_count / $total) * 100);
    }
}
