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
    const TYPE_CONTRACT_EXPIRING = 'contract_expiring';
    const TYPE_TASK_OVERDUE = 'task_overdue';
    const TYPE_LEAD_NEW = 'lead_new';
    const TYPE_LEAD_WON = 'lead_won';
    const TYPE_PROJECT_CREATED = 'project_created';
    const TYPE_EXPENSE_CREATED = 'expense_created';
    const TYPE_MEETING_REMINDER = 'meeting_reminder';
    const TYPE_PAYMENT_RECEIVED = 'payment_received';
    const TYPE_TASK_COMPLETED = 'task_completed';

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
