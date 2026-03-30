<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleDriveToken extends Model
{
    protected $fillable = [
        'company_id',
        'access_token',
        'refresh_token',
        'expires_at',
        'drive_folder_id',
        'drive_folder_name',
        'last_synced_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'last_synced_at' => 'datetime',
    ];

    protected $hidden = ['access_token', 'refresh_token'];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
