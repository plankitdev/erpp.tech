<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add temperature and lost_reason columns
        Schema::table('leads', function (Blueprint $table) {
            $table->enum('temperature', ['hot', 'warm', 'cold'])->default('warm')->after('stage');
            $table->string('lost_reason')->nullable()->after('temperature');
        });

        // Alter stage enum to include 'lost'
        DB::statement("ALTER TABLE leads MODIFY COLUMN stage ENUM('new','first_contact','proposal_sent','negotiation','contract_signed','lost') DEFAULT 'new'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE leads MODIFY COLUMN stage ENUM('new','first_contact','proposal_sent','negotiation','contract_signed') DEFAULT 'new'");

        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['temperature', 'lost_reason']);
        });
    }
};
