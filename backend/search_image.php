<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$search = 'HJPDZL3Z';

// Search ALL tables for this filename
$tables = Illuminate\Support\Facades\DB::select('SHOW TABLES');
$dbName = Illuminate\Support\Facades\DB::getDatabaseName();
$key = "Tables_in_$dbName";

echo "Searching for '$search' in all tables...\n\n";

foreach ($tables as $table) {
    $tableName = $table->$key;
    $columns = Illuminate\Support\Facades\DB::select("SHOW COLUMNS FROM `$tableName`");
    
    foreach ($columns as $col) {
        $colName = $col->Field;
        $type = strtolower($col->Type);
        // Only search text/varchar/json columns
        if (str_contains($type, 'char') || str_contains($type, 'text') || str_contains($type, 'json') || str_contains($type, 'blob')) {
            $results = Illuminate\Support\Facades\DB::select(
                "SELECT id, `$colName` FROM `$tableName` WHERE `$colName` LIKE ?",
                ["%$search%"]
            );
            if (count($results) > 0) {
                echo "FOUND in $tableName.$colName:\n";
                foreach ($results as $r) {
                    echo "  ID: {$r->id} | Value: " . substr($r->$colName, 0, 200) . "\n";
                }
                echo "\n";
            }
        }
    }
}

echo "Search complete.\n";
