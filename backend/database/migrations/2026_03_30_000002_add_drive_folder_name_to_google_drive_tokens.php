<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('google_drive_tokens', function (Blueprint $table) {
            $table->string('drive_folder_name')->nullable()->after('drive_folder_id');
        });
    }

    public function down(): void
    {
        Schema::table('google_drive_tokens', function (Blueprint $table) {
            $table->dropColumn('drive_folder_name');
        });
    }
};
