<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id', 'created_by', 'title', 'body', 'priority', 'is_pinned',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
