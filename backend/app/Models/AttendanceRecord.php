<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceRecord extends Model
{
    use HasCompany;

    const STATUS_PRESENT = 'present';
    const STATUS_ABSENT = 'absent';
    const STATUS_LATE = 'late';
    const STATUS_HALF_DAY = 'half_day';
    const STATUS_LEAVE = 'leave';
    const STATUSES = [self::STATUS_PRESENT, self::STATUS_ABSENT, self::STATUS_LATE, self::STATUS_HALF_DAY, self::STATUS_LEAVE];

    protected $fillable = [
        'company_id', 'user_id', 'date', 'check_in', 'check_out',
        'hours_worked', 'status', 'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'hours_worked' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
