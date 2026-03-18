<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequest extends Model
{
    use HasCompany;

    const TYPE_ANNUAL = 'annual';
    const TYPE_SICK = 'sick';
    const TYPE_PERSONAL = 'personal';
    const TYPE_UNPAID = 'unpaid';
    const TYPE_OTHER = 'other';
    const TYPES = [self::TYPE_ANNUAL, self::TYPE_SICK, self::TYPE_PERSONAL, self::TYPE_UNPAID, self::TYPE_OTHER];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUSES = [self::STATUS_PENDING, self::STATUS_APPROVED, self::STATUS_REJECTED];

    protected $fillable = [
        'company_id', 'user_id', 'approved_by', 'type',
        'start_date', 'end_date', 'days', 'reason',
        'status', 'rejection_reason',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
