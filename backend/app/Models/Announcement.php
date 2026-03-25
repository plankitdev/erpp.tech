<?php

namespace App\Models;

use App\Traits\HasCompany;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Announcement extends Model
{
    use HasCompany, LogsActivity;

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

    public function likes(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'announcement_likes')
            ->withTimestamps();
    }
}
