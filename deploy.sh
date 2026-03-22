#!/bin/bash
set -e
echo "========================================="
echo "  ERPP Deployment Script"
echo "========================================="

# ===== CONFIGURE THESE FOR YOUR NEW SERVER =====
BACKEND="${ERPP_BACKEND_PATH:-/home/\$USER/backend}"
API_PUBLIC="${ERPP_API_PUBLIC:-/home/\$USER/domains/erpp.tech/public_html/backend}"
FRONTEND_PUBLIC="${ERPP_FRONTEND_PUBLIC:-/home/\$USER/domains/erpp.tech/public_html}"
# ================================================

# 1. Set up backend public folder
echo ""
echo "[1/6] Setting up backend public folder..."
mkdir -p "$API_PUBLIC"

# Create index.php for backend
cat > "$API_PUBLIC/index.php" << PHPEOF
<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

\$basePath = '$BACKEND';

if (file_exists(\$maintenance = \$basePath.'/storage/framework/maintenance.php')) {
    require \$maintenance;
}

require \$basePath.'/vendor/autoload.php';

\$app = require_once \$basePath.'/bootstrap/app.php';

\$app->usePublicPath(__DIR__);

\$app->handleRequest(Request::capture());
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

# 2. Deploy frontend
echo ""
echo "[2/6] Deploying frontend..."
if [ -d "/tmp/erpp-frontend" ]; then
    find "$FRONTEND_PUBLIC" -maxdepth 1 -not -name 'backend' -not -name '.' -not -name '..' -not -name '.htaccess' -type f -delete 2>/dev/null || true
    rm -rf "$FRONTEND_PUBLIC/assets" 2>/dev/null || true
    cp -r /tmp/erpp-frontend/* "$FRONTEND_PUBLIC/"
    rm -rf /tmp/erpp-frontend
    echo "  Frontend files deployed"
else
    echo "  WARNING: /tmp/erpp-frontend not found, skipping frontend deploy"
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

# 3. Storage symlink
echo ""
echo "[3/6] Setting up storage..."
if [ -L "$API_PUBLIC/storage" ]; then
    rm "$API_PUBLIC/storage"
fi
ln -sf "$BACKEND/storage/app/public" "$API_PUBLIC/storage"
echo "  Storage symlink created"

chmod -R 775 "$BACKEND/storage" 2>/dev/null || true
chmod -R 775 "$BACKEND/bootstrap/cache" 2>/dev/null || true
echo "  Permissions set"
echo "  Storage setup DONE"

# 4. Laravel optimization
echo ""
echo "[4/6] Optimizing Laravel..."
cd "$BACKEND"
php artisan config:cache 2>&1
php artisan route:cache 2>&1
php artisan view:cache 2>&1
echo "  Laravel optimization DONE"

# 5. Generate app key if needed
echo ""
echo "[5/6] Checking app key..."
php artisan key:show 2>&1 || php artisan key:generate --force 2>&1
echo "  App key OK"

# 6. Verify deployment
echo ""
echo "[6/6] Verifying deployment..."
echo "  API index.php: $([ -f $API_PUBLIC/index.php ] && echo 'EXISTS' || echo 'MISSING')"
echo "  API .htaccess: $([ -f $API_PUBLIC/.htaccess ] && echo 'EXISTS' || echo 'MISSING')"
echo "  Frontend index.html: $([ -f $FRONTEND_PUBLIC/index.html ] && echo 'EXISTS' || echo 'MISSING')"
echo "  Frontend .htaccess: $([ -f $FRONTEND_PUBLIC/.htaccess ] && echo 'EXISTS' || echo 'MISSING')"
echo "  Storage symlink: $([ -L $API_PUBLIC/storage ] && echo 'EXISTS' || echo 'MISSING')"
echo "  .env file: $([ -f $BACKEND/.env ] && echo 'EXISTS' || echo 'MISSING')"

echo ""
echo "========================================="
echo "  DEPLOYMENT COMPLETE!"
echo "  Frontend: https://erpp.tech"
echo "  API: https://erpp.tech/backend"
echo "========================================="
