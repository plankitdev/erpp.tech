<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('managed_files', function (Blueprint $table) {
            $table->string('drive_file_id')->nullable()->after('notes');
        });

        Schema::table('folders', function (Blueprint $table) {
            $table->string('drive_folder_id')->nullable()->after('created_by');
        });
    }

    public function down(): void
    {
        Schema::table('managed_files', function (Blueprint $table) {
            $table->dropColumn('drive_file_id');
        });

        Schema::table('folders', function (Blueprint $table) {
            $table->dropColumn('drive_folder_id');
        });
    }
};
