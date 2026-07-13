<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedFilter extends Model
{
    use HasCompany, HasFactory;

    protected $fillable = [
        'company_id', 'user_id', 'name', 'scope', 'criteria', 'is_shared',
    ];

    protected $casts = [
        'criteria'  => 'array',
        'is_shared' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
