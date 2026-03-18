<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasCompany, HasFactory;

    const TYPE_INVOICE_OVERDUE = 'invoice_overdue';
    const TYPE_TASK_ASSIGNED = 'task_assigned';
    const TYPE_FILE_SENT = 'file_sent';
    const TYPE_SALARY_PAID = 'salary_paid';

    protected $fillable = [
        'company_id',
        'user_id',
        'type',
        'title',
        'body',
        'link',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }
}
