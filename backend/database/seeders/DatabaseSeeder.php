<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Currency;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // العملات
        Currency::insert([
            ['code' => 'EGP', 'rate' => 1.00, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'USD', 'rate' => 50.00, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'SAR', 'rate' => 13.30, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Super Admin
        User::create([
            'name'       => 'Ahmed Elsayed',
            'email'      => 'admin@erpp.tech',
            'password'   => Hash::make('password'),
            'role'       => 'super_admin',
            'company_id' => null,
        ]);
    }
}
