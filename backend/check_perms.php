<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->handleRequest(Illuminate\Http\Request::capture());

$users = App\Models\User::whereIn('role', ['employee', 'manager', 'accountant', 'sales'])
    ->get(['id', 'name', 'email', 'role', 'permissions']);

foreach ($users as $u) {
    echo "ID: {$u->id} | {$u->name} | Role: {$u->role}\n";
    $effective = $u->getEffectivePermissions();
    echo "  Effective Permissions: " . json_encode($effective) . "\n";
    echo "  DB permissions column: " . json_encode($u->getRawOriginal('permissions')) . "\n";
    echo "  hasPermission('users'): " . (collect($effective)->contains(fn($p) => $p === 'users' || (str_contains($p, '.') && explode('.', $p)[0] === 'users')) ? 'YES' : 'NO') . "\n";
    echo "---\n";
}
