<?php
require __DIR__ . '/backend/vendor/autoload.php';
$app = require __DIR__ . '/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Tasks: " . DB::table('tasks')->count() . PHP_EOL;
echo "Projects: " . DB::table('projects')->count() . PHP_EOL;

echo PHP_EOL . "Users:" . PHP_EOL;
foreach(DB::table('users')->select('id','name','role','company_id')->get() as $u) {
    echo "  id={$u->id} role={$u->role} company_id=" . ($u->company_id ?? 'NULL') . " name={$u->name}" . PHP_EOL;
}

echo PHP_EOL . "Tasks by company_id:" . PHP_EOL;
foreach(DB::table('tasks')->selectRaw('company_id, count(*) as cnt')->groupBy('company_id')->get() as $r) {
    echo "  company_id=" . ($r->company_id ?? 'NULL') . " count={$r->cnt}" . PHP_EOL;
}

echo PHP_EOL . "Projects by company_id:" . PHP_EOL;
foreach(DB::table('projects')->selectRaw('company_id, count(*) as cnt')->groupBy('company_id')->get() as $r) {
    echo "  company_id=" . ($r->company_id ?? 'NULL') . " count={$r->cnt}" . PHP_EOL;
}
