<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add more fields to employees
        Schema::table('employees', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('position');
            $table->string('email')->nullable()->after('phone');
            $table->string('national_id')->nullable()->after('email');
            $table->string('address')->nullable()->after('national_id');
            $table->string('bank_name')->nullable()->after('address');
            $table->string('bank_account')->nullable()->after('bank_name');
            $table->date('contract_start')->nullable()->after('join_date');
            $table->date('contract_end')->nullable()->after('contract_start');
            $table->text('notes')->nullable()->after('contract_end');
        });

        // File templates
        Schema::create('file_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('category'); // invoice, contract, plan, proposal, report, other
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('file_templates');

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'phone', 'email', 'national_id', 'address',
                'bank_name', 'bank_account', 'contract_start', 'contract_end', 'notes',
            ]);
        });
    }
};
