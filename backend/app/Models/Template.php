<?php

namespace App\Models;

use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Template extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id', 'category_id', 'name', 'description', 'schema',
        'preview_data', 'thumbnail_color', 'is_default', 'is_locked',
        'usage_count', 'created_by',
    ];

    protected $casts = [
        'schema'       => 'array',
        'preview_data' => 'array',
        'is_default'   => 'boolean',
        'is_locked'    => 'boolean',
        'usage_count'  => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(TemplateCategory::class, 'category_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function userDocuments(): HasMany
    {
        return $this->hasMany(UserDocument::class);
    }
}
