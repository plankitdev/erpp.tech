<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('name');
            $table->decimal('monthly_payment', 12, 2)->nullable()->after('service');
            $table->unsignedTinyInteger('payment_day')->nullable()->after('monthly_payment');
        });

        // Generate slugs for existing clients
        $clients = \App\Models\Client::withoutGlobalScopes()->get();
        foreach ($clients as $client) {
            $slug = \Illuminate\Support\Str::slug($client->name);
            $original = $slug;
            $i = 1;
            while (\App\Models\Client::withoutGlobalScopes()->where('slug', $slug)->where('id', '!=', $client->id)->exists()) {
                $slug = $original . '-' . $i++;
            }
            $client->update(['slug' => $slug]);
        }
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['slug', 'monthly_payment', 'payment_day']);
        });
    }
};
