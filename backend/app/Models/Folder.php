<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HasCompany;

class Folder extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id', 'parent_id', 'name', 'type',
        'client_id', 'project_id', 'created_by',
        'drive_folder_id',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Folder::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Folder::class, 'parent_id');
    }

    public function files(): HasMany
    {
        return $this->hasMany(ManagedFile::class);
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

    public function getPathAttribute(): string
    {
        $parts = [$this->name];
        $current = $this;
        while ($current->parent) {
            $current = $current->parent;
            array_unshift($parts, $current->name);
        }
        return implode(' / ', $parts);
    }
}
