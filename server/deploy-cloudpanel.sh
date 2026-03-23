#!/bin/bash
set -e

# =============================================================
#  ERPP.tech — CloudPanel Deployment Script
#  Run as ROOT: bash /tmp/deploy-cloudpanel.sh
# =============================================================

DOMAIN="erpp.tech"
SITE_USER="erpp"
SITE_ROOT="/home/${SITE_USER}/htdocs/${DOMAIN}"

DB_NAME="erppdb"
DB_USER="erppuser"
DB_PASS="apVAr0H737by3ZaajhT9"

echo "========================================="
echo "  ERPP.tech Deployment"
echo "========================================="

# ---------- 1. Install Node.js 20 ----------
echo ""
echo "[1/7] Checking Node.js..."
if command -v node &>/dev/null && node -v | grep -qE "v2[0-9]"; then
    echo "  Node.js $(node -v) already installed"
else
    echo "  Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "  Node.js $(node -v) installed"
fi

# ---------- 2. Clone Repository ----------
echo ""
echo "[2/7] Setting up repository..."

# Backup any existing content
if [ -d "${SITE_ROOT}/.git" ]; then
    echo "  Repo already exists, pulling latest..."
    cd "${SITE_ROOT}"
    sudo -u "${SITE_USER}" git pull origin main
else
    echo "  Cloning repository..."
    # Save any CloudPanel default files
    TEMP_BAK="/tmp/erpp-site-backup"
    rm -rf "${TEMP_BAK}"
    
    # Remove default content but keep the directory
    find "${SITE_ROOT}" -mindepth 1 -delete 2>/dev/null || true
    
    # Clone as site user
    sudo -u "${SITE_USER}" git clone https://github.com/plankitdev/erpp.tech.git "${SITE_ROOT}"
    echo "  Repository cloned"
fi

# ---------- 3. Setup Backend ----------
echo ""
echo "[3/7] Setting up backend..."
cd "${SITE_ROOT}/backend"

# Install PHP dependencies
sudo -u "${SITE_USER}" composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Create .env from example
sudo -u "${SITE_USER}" cp .env.example .env

# Configure .env for production
cat > "${SITE_ROOT}/backend/.env" << ENVEOF
APP_NAME=ERPP
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://${DOMAIN}

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US
APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${DB_NAME}
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASS}

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.${DOMAIN}
SESSION_SECURE_COOKIE=true

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

MAIL_MAILER=log
MAIL_FROM_ADDRESS="noreply@${DOMAIN}"
MAIL_FROM_NAME="ERPP"

FRONTEND_URL=https://${DOMAIN}
SANCTUM_STATEFUL_DOMAINS=${DOMAIN},www.${DOMAIN}
ENVEOF

chown "${SITE_USER}:${SITE_USER}" "${SITE_ROOT}/backend/.env"

# Generate app key
sudo -u "${SITE_USER}" php artisan key:generate --force

# Run migrations
sudo -u "${SITE_USER}" php artisan migrate --force

# Storage link (to backend/public/storage)
sudo -u "${SITE_USER}" php artisan storage:link 2>/dev/null || true

# Set permissions
chmod -R 775 "${SITE_ROOT}/backend/storage"
chmod -R 775 "${SITE_ROOT}/backend/bootstrap/cache"
chown -R "${SITE_USER}:${SITE_USER}" "${SITE_ROOT}/backend/storage"
chown -R "${SITE_USER}:${SITE_USER}" "${SITE_ROOT}/backend/bootstrap/cache"

# Cache config
sudo -u "${SITE_USER}" php artisan config:cache
sudo -u "${SITE_USER}" php artisan route:cache
sudo -u "${SITE_USER}" php artisan view:cache

echo "  Backend setup complete"

# ---------- 4. Build Frontend ----------
echo ""
echo "[4/7] Building frontend..."
cd "${SITE_ROOT}/frontend"

sudo -u "${SITE_USER}" npm ci
sudo -u "${SITE_USER}" npm run build

echo "  Frontend built"

# ---------- 5. Configure Nginx Vhost ----------
echo ""
echo "[5/7] Configuring Nginx..."

VHOST_FILE="/etc/nginx/sites-enabled/${DOMAIN}.conf"

# Backup existing vhost
if [ -f "${VHOST_FILE}" ]; then
    cp "${VHOST_FILE}" "${VHOST_FILE}.bak.$(date +%s)"
fi

cat > "${VHOST_FILE}" << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name erpp.tech www.erpp.tech;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name erpp.tech www.erpp.tech;

    ssl_certificate /etc/nginx/ssl-certificates/erpp.tech.crt;
    ssl_certificate_key /etc/nginx/ssl-certificates/erpp.tech.key;

    # ---- Frontend (React SPA) ----
    root /home/erpp/htdocs/erpp.tech/frontend/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # ---- Backend API (Laravel) ----
    location ^~ /backend {
        alias /home/erpp/htdocs/erpp.tech/backend/public;
        index index.php;

        # Try static files first, then Laravel front controller
        try_files $uri @backend_php;

        # PHP files inside /backend
        location ~ \.php$ {
            # Reconstruct SCRIPT_FILENAME for alias
            fastcgi_param SCRIPT_FILENAME /home/erpp/htdocs/erpp.tech/backend/public/index.php;
            fastcgi_param SCRIPT_NAME /backend/index.php;
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_read_timeout 60;
            fastcgi_buffers 16 16k;
            fastcgi_buffer_size 32k;
        }
    }

    location @backend_php {
        fastcgi_param SCRIPT_FILENAME /home/erpp/htdocs/erpp.tech/backend/public/index.php;
        fastcgi_param SCRIPT_NAME /backend/index.php;
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_read_timeout 60;
    }

    # ---- Storage (uploaded files) ----
    location ^~ /storage {
        alias /home/erpp/htdocs/erpp.tech/backend/storage/app/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # ---- Frontend static assets (cache forever) ----
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # ---- SPA fallback (React Router) ----
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Block dotfiles
    location ~ /\. {
        deny all;
    }

    access_log /home/erpp/logs/nginx/access.log;
    error_log /home/erpp/logs/nginx/error.log;

    client_max_body_size 64M;
}
NGINXEOF

# Create logs directory
mkdir -p "/home/${SITE_USER}/logs/nginx"
chown -R "${SITE_USER}:${SITE_USER}" "/home/${SITE_USER}/logs"

echo "  Nginx vhost configured"

# ---------- 6. Fix PHP-FPM socket ----------
echo ""
echo "[6/7] Checking PHP-FPM..."

# CloudPanel may use a per-site pool socket
POOL_SOCK="/var/run/php/php8.2-fpm-${SITE_USER}.sock"
if [ -S "${POOL_SOCK}" ]; then
    echo "  Found site-specific socket: ${POOL_SOCK}"
    sed -i "s|php8.2-fpm.sock|php8.2-fpm-${SITE_USER}.sock|g" "${VHOST_FILE}"
    echo "  Updated vhost to use site socket"
else
    echo "  Using default PHP-FPM socket"
fi

# ---------- 7. Test & Restart Nginx ----------
echo ""
echo "[7/7] Testing Nginx config..."
nginx -t

if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "  Nginx reloaded successfully"
else
    echo "  ERROR: Nginx config test failed!"
    echo "  Restoring backup..."
    if [ -f "${VHOST_FILE}.bak."* ]; then
        cp "${VHOST_FILE}.bak."* "${VHOST_FILE}" 2>/dev/null
        systemctl reload nginx
    fi
    exit 1
fi

# ---------- Setup SSH deploy key ----------
echo ""
echo "[BONUS] Setting up deploy SSH key..."
DEPLOY_SSH_DIR="/home/${SITE_USER}/.ssh"
mkdir -p "${DEPLOY_SSH_DIR}"

# Generate deploy key for GitHub Actions
if [ ! -f "${DEPLOY_SSH_DIR}/deploy_key" ]; then
    ssh-keygen -t ed25519 -C "deploy@erpp.tech" -f "${DEPLOY_SSH_DIR}/deploy_key" -N ""
    cat "${DEPLOY_SSH_DIR}/deploy_key.pub" >> "${DEPLOY_SSH_DIR}/authorized_keys"
    chmod 600 "${DEPLOY_SSH_DIR}/authorized_keys"
    chown -R "${SITE_USER}:${SITE_USER}" "${DEPLOY_SSH_DIR}"
    echo "  Deploy key generated"
fi

echo ""
echo "========================================="
echo "  DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "  Frontend: https://erpp.tech"
echo "  API:      https://erpp.tech/backend/api"
echo ""
echo "  --- GitHub Actions Deploy Key ---"
echo "  Copy the PRIVATE key below and add it"
echo "  as SSH_PRIVATE_KEY secret on GitHub:"
echo ""
cat "${DEPLOY_SSH_DIR}/deploy_key"
echo ""
echo ""
echo "  GitHub Secrets to add:"
echo "  SSH_HOST = 187.124.45.252"
echo "  SSH_USERNAME = ${SITE_USER}"
echo "  SSH_PORT = 22"
echo "  SSH_PRIVATE_KEY = (the key above)"
echo ""
echo "========================================="
