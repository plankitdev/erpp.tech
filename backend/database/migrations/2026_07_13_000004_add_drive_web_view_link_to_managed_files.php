<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('managed_files', function (Blueprint $table) {
            $table->string('drive_web_view_link')->nullable()->after('drive_file_id');
        });
    }

    public function down(): void
    {
        Schema::table('managed_files', function (Blueprint $table) {
            $table->dropColumn('drive_web_view_link');
        });
    }
};
