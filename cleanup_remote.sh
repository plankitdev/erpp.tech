cd "$HOME/backend" && cat > /tmp/cleanup.php << 'PHPEOF'
<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
DB::table('users')->where('email', '!=', 'admin@erpp.tech')->delete();
DB::table('companies')->truncate();
echo "Users: " . DB::table('users')->count() . " Companies: " . DB::table('companies')->count() . PHP_EOL;
PHPEOF
php /tmp/cleanup.php && rm /tmp/cleanup.php
