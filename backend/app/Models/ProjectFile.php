<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectFile extends Model
{
    protected $fillable = [
        'project_id', 'uploaded_by', 'name', 'file_path', 'file_type', 'file_size', 'parent_id',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ProjectFile::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(ProjectFile::class, 'parent_id');
    }
}
