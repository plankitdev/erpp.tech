<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Clear avatar references for files that don't exist on disk
$users = App\Models\User::whereNotNull('avatar')->where('avatar', '!=', '')->get();
$cleaned = 0;
foreach ($users as $u) {
    $path = storage_path('app/public/' . $u->avatar);
    if (!file_exists($path)) {
        echo "Cleaning avatar for user {$u->id} ({$u->name}): {$u->avatar}\n";
        $u->update(['avatar' => null]);
        $cleaned++;
    }
}
echo "Cleaned $cleaned broken avatar references.\n";
