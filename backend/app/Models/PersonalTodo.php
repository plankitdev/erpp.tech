<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PersonalTodo extends Model
{
    protected $fillable = [
        'user_id', 'title', 'is_completed', 'sort_order', 'due_date',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'due_date' => 'date:Y-m-d',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
