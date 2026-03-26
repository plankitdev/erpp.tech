<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Show all users with avatar set
$users = App\Models\User::whereNotNull('avatar')->where('avatar', '!=', '')->get();
echo "Users with avatar field set: " . $users->count() . "\n";
foreach ($users as $u) {
    $fullPath = storage_path('app/public/' . $u->avatar);
    $exists = file_exists($fullPath) ? 'EXISTS' : 'MISSING';
    echo "  ID:{$u->id} | {$u->name} | avatar: {$u->avatar} | path: {$fullPath} | {$exists}\n";
    
    // If missing, clear it
    if (!file_exists($fullPath)) {
        $u->avatar = null;
        $u->saveQuietly();
        echo "    -> CLEARED\n";
    }
}

// Show companies with logo/icon
$companies = App\Models\Company::get(['id', 'name', 'logo', 'icon']);
echo "\nCompanies:\n";
foreach ($companies as $c) {
    echo "  ID:{$c->id} | {$c->name} | logo: {$c->logo} | icon: {$c->icon}\n";
    if ($c->logo) {
        $lp = storage_path('app/public/' . $c->logo);
        echo "    logo path: $lp | " . (file_exists($lp) ? 'EXISTS' : 'MISSING') . "\n";
        if (!file_exists($lp)) {
            $c->logo = null;
            $c->saveQuietly();
            echo "    -> CLEARED logo\n";
        }
    }
    if ($c->icon) {
        $ip = storage_path('app/public/' . $c->icon);
        echo "    icon path: $ip | " . (file_exists($ip) ? 'EXISTS' : 'MISSING') . "\n";
        if (!file_exists($ip)) {
            $c->icon = null;
            $c->saveQuietly();
            echo "    -> CLEARED icon\n";
        }
    }
}

echo "\nDone.\n";
