<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\HasCompany;

class ManagedFile extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id', 'folder_id', 'name', 'file_path',
        'mime_type', 'file_size', 'status',
        'uploaded_by', 'approved_by', 'approved_at', 'notes',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'file_size' => 'integer',
    ];

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
