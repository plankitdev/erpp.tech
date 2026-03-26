<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$search = 'HJPDZL3';

$users = App\Models\User::where('avatar', 'like', "%$search%")->get(['id', 'name', 'avatar']);
echo "Users with this avatar: " . $users->count() . "\n";
foreach ($users as $u) {
    echo "  ID:{$u->id} | {$u->name} | avatar: {$u->avatar}\n";
}

$companies = App\Models\Company::where('logo', 'like', "%$search%")
    ->orWhere('icon', 'like', "%$search%")
    ->get(['id', 'name', 'logo', 'icon']);
echo "Companies with this image: " . $companies->count() . "\n";
foreach ($companies as $c) {
    echo "  ID:{$c->id} | {$c->name} | logo: {$c->logo} | icon: {$c->icon}\n";
}

// Also check if ANY avatars or logos reference missing files
$allUsers = App\Models\User::whereNotNull('avatar')->where('avatar', '!=', '')->get(['id', 'name', 'avatar']);
echo "\nAll users with avatars:\n";
foreach ($allUsers as $u) {
    $path = storage_path('app/public/' . str_replace('avatars/', '', $u->avatar));
    $exists = file_exists($path) ? 'EXISTS' : 'MISSING';
    echo "  ID:{$u->id} | {$u->name} | {$u->avatar} | $exists\n";
}
