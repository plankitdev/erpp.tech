<?php
// Cleanup script for production - keep only super admin
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

DB::statement('SET FOREIGN_KEY_CHECKS=0');

// Delete non-super-admin users
DB::table('users')->where('role', '!=', 'super_admin')->delete();

// Delete test companies
DB::table('companies')->truncate();

// Delete currencies (will be re-created via seeder or manually)
// Keep currencies as they are useful
// DB::table('currencies')->truncate();

DB::statement('SET FOREIGN_KEY_CHECKS=1');

// Show remaining data
echo "Users: " . DB::table('users')->count() . "\n";
echo "Companies: " . DB::table('companies')->count() . "\n";
echo "Currencies: " . DB::table('currencies')->count() . "\n";

$admin = DB::table('users')->where('role', 'super_admin')->first();
if ($admin) {
    echo "\nSuper Admin:\n";
    echo "  Name: {$admin->name}\n";
    echo "  Email: {$admin->email}\n";
    echo "  Role: {$admin->role}\n";
}
