<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasCompany, HasFactory, LogsActivity;

    const PRIORITY_LOW = 'low';
    const PRIORITY_MEDIUM = 'medium';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_URGENT = 'urgent';
    const PRIORITIES = [self::PRIORITY_LOW, self::PRIORITY_MEDIUM, self::PRIORITY_HIGH, self::PRIORITY_URGENT];

    const STATUS_OPEN = 'open';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_WAITING = 'waiting';
    const STATUS_RESOLVED = 'resolved';
    const STATUS_CLOSED = 'closed';
    const STATUSES = [self::STATUS_OPEN, self::STATUS_IN_PROGRESS, self::STATUS_WAITING, self::STATUS_RESOLVED, self::STATUS_CLOSED];

    const CATEGORY_BUG = 'bug';
    const CATEGORY_FEATURE = 'feature';
    const CATEGORY_SUPPORT = 'support';
    const CATEGORY_INQUIRY = 'inquiry';
    const CATEGORY_OTHER = 'other';
    const CATEGORIES = [self::CATEGORY_BUG, self::CATEGORY_FEATURE, self::CATEGORY_SUPPORT, self::CATEGORY_INQUIRY, self::CATEGORY_OTHER];

    protected $fillable = [
        'company_id', 'client_id', 'project_id', 'created_by', 'assigned_to',
        'reference', 'subject', 'description', 'priority', 'status', 'category',
        'resolved_at', 'closed_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(TicketReply::class);
    }

    public static function generateReference(int $companyId): string
    {
        $count = static::where('company_id', $companyId)->count() + 1;
        return 'TK-' . str_pad($count, 5, '0', STR_PAD_LEFT);
    }
}
