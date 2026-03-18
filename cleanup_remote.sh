cd /home/u742115549/backend && cat > /tmp/cleanup.php << 'PHPEOF'
<?php
require __DIR__ . '/../home/u742115549/backend/vendor/autoload.php';
$app = require_once '/home/u742115549/backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
DB::table('users')->where('email', '!=', 'admin@erpflex.com')->delete();
DB::table('companies')->truncate();
echo "Users: " . DB::table('users')->count() . " Companies: " . DB::table('companies')->count() . PHP_EOL;
PHPEOF
php /tmp/cleanup.php && rm /tmp/cleanup.php
