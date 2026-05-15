<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fixed_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20);
            $table->string('name');
            $table->enum('category', ['equipment', 'furniture', 'vehicles', 'electronics', 'property', 'other']);
            $table->date('purchase_date');
            $table->decimal('purchase_cost', 12, 2);
            $table->decimal('salvage_value', 12, 2)->default(0);
            $table->unsignedInteger('useful_life_months');
            $table->enum('depreciation_method', ['straight_line', 'declining_balance'])->default('straight_line');
            $table->decimal('accumulated_depreciation', 12, 2)->default(0);
            $table->decimal('current_value', 12, 2);
            $table->string('location')->nullable();
            $table->string('serial_number', 100)->nullable();
            $table->enum('status', ['active', 'disposed', 'under_maintenance'])->default('active');
            $table->date('disposed_date')->nullable();
            $table->decimal('disposal_amount', 12, 2)->nullable();
            $table->foreignId('cost_center_id')->nullable()->constrained('cost_centers')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'code']);
            $table->index(['company_id', 'status']);
            $table->index(['company_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fixed_assets');
    }
};
