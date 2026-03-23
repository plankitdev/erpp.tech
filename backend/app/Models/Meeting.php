<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Meeting extends Model
{
    use HasCompany;

    public const TYPE_TEAM   = 'team';
    public const TYPE_SALES  = 'sales';
    public const TYPE_CLIENT = 'client';
    public const TYPE_OTHER  = 'other';

    public const STATUS_SCHEDULED   = 'scheduled';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED   = 'completed';
    public const STATUS_CANCELLED   = 'cancelled';

    protected $fillable = [
        'company_id', 'created_by', 'project_id', 'title',
        'description', 'start_time', 'end_time', 'location',
        'meeting_link', 'type', 'status', 'notes',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'meeting_participants')
            ->withPivot('status')
            ->withTimestamps();
    }
}
