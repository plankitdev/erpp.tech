#!/bin/bash
set -e
echo "========================================="
echo "  ERPFlex Deployment Script"
echo "========================================="

BACKEND="/home/u742115549/backend"
API_PUBLIC="/home/u742115549/domains/erpflex.online/public_html/backend"
FRONTEND_PUBLIC="/home/u742115549/domains/erpflex.online/public_html"

# 1. Clean DB - remove test users and companies
echo ""
echo "[1/7] Cleaning database..."
mysql -u u742115549_erpflex -p'Nenootorres09*' u742115549_erpflex -e "DELETE FROM users WHERE email != 'admin@erpflex.com';"
mysql -u u742115549_erpflex -p'Nenootorres09*' u742115549_erpflex -e "DELETE FROM companies WHERE 1=1;"
echo "  Users remaining: $(mysql -u u742115549_erpflex -p'Nenootorres09*' u742115549_erpflex -N -e 'SELECT COUNT(*) FROM users;')"
echo "  Companies remaining: $(mysql -u u742115549_erpflex -p'Nenootorres09*' u742115549_erpflex -N -e 'SELECT COUNT(*) FROM companies;')"
echo "  Currencies: $(mysql -u u742115549_erpflex -p'Nenootorres09*' u742115549_erpflex -N -e 'SELECT COUNT(*) FROM currencies;')"
echo "  DB cleanup DONE"

# 2. Set up backend public folder
echo ""
echo "[2/7] Setting up backend public folder..."
mkdir -p "$API_PUBLIC"

# Create index.php for backend
cat > "$API_PUBLIC/index.php" << 'PHPEOF'
<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$basePath = '/home/u742115549/backend';

if (file_exists($maintenance = $basePath.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $basePath.'/vendor/autoload.php';

$app = require_once $basePath.'/bootstrap/app.php';

$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
PHPEOF

# Create .htaccess for backend
cat > "$API_PUBLIC/.htaccess" << 'HTEOF'
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Handle X-XSRF-Token Header
    RewriteCond %{HTTP:x-xsrf-token} .
    RewriteRule .* - [E=HTTP_X_XSRF_TOKEN:%{HTTP:X-XSRF-Token}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
HTEOF

echo "  API index.php created"
echo "  API .htaccess created"
echo "  Backend public folder setup DONE"

# 3. Extract frontend
echo ""
echo "[3/7] Deploying frontend..."
if [ -f /home/u742115549/frontend.tar ]; then
    # Clean existing frontend files (except backend folder and .htaccess)
    find "$FRONTEND_PUBLIC" -maxdepth 1 -not -name 'backend' -not -name '.' -not -name '..' -not -name '.htaccess' -type f -delete 2>/dev/null || true
    rm -rf "$FRONTEND_PUBLIC/assets" 2>/dev/null || true
    
    # Extract frontend
    tar -xf /home/u742115549/frontend.tar -C "$FRONTEND_PUBLIC"
    echo "  Frontend files extracted"
else
    echo "  WARNING: frontend.tar not found at /home/u742115549/frontend.tar"
fi

# Create frontend .htaccess for SPA routing
cat > "$FRONTEND_PUBLIC/.htaccess" << 'HTEOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Don't rewrite files or directories
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # Don't rewrite backend requests
    RewriteCond %{REQUEST_URI} !^/backend
    
    # Rewrite everything else to index.html
    RewriteRule ^ index.html [L]
</IfModule>
HTEOF
echo "  Frontend .htaccess created"
echo "  Frontend deploy DONE"

# 4. Storage symlink
echo ""
echo "[4/7] Setting up storage..."
# Create storage symlink
if [ -L "$API_PUBLIC/storage" ]; then
    rm "$API_PUBLIC/storage"
fi
ln -sf "$BACKEND/storage/app/public" "$API_PUBLIC/storage"
echo "  Storage symlink created"

# Set permissions
chmod -R 775 "$BACKEND/storage" 2>/dev/null || true
chmod -R 775 "$BACKEND/bootstrap/cache" 2>/dev/null || true
echo "  Permissions set"
echo "  Storage setup DONE"

# 5. Laravel optimization
echo ""
echo "[5/7] Optimizing Laravel..."
cd "$BACKEND"
php artisan config:cache 2>&1
php artisan route:cache 2>&1
php artisan view:cache 2>&1
echo "  Laravel optimization DONE"

# 6. Generate app key if needed
echo ""
echo "[6/7] Checking app key..."
php artisan key:show 2>&1 || php artisan key:generate --force 2>&1
echo "  App key OK"

# 7. Verify deployment
echo ""
echo "[7/7] Verifying deployment..."
echo "  API index.php: $([ -f $API_PUBLIC/index.php ] && echo 'EXISTS' || echo 'MISSING')"
echo "  API .htaccess: $([ -f $API_PUBLIC/.htaccess ] && echo 'EXISTS' || echo 'MISSING')"
echo "  Frontend index.html: $([ -f $FRONTEND_PUBLIC/index.html ] && echo 'EXISTS' || echo 'MISSING')"
echo "  Frontend .htaccess: $([ -f $FRONTEND_PUBLIC/.htaccess ] && echo 'EXISTS' || echo 'MISSING')"
echo "  Storage symlink: $([ -L $API_PUBLIC/storage ] && echo 'EXISTS' || echo 'MISSING')"
echo "  .env file: $([ -f $BACKEND/.env ] && echo 'EXISTS' || echo 'MISSING')"
ls -la "$API_PUBLIC/" 2>/dev/null | head -15
echo ""
ls -la "$FRONTEND_PUBLIC/" 2>/dev/null | head -15

echo ""
echo "========================================="
echo "  DEPLOYMENT COMPLETE!"
echo "  Frontend: https://erpflex.online"
echo "  API: https://erpflex.online/backend"
echo "========================================="
