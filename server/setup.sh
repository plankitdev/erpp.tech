#!/bin/bash
set -e

# =============================================================
#  ERPP.tech — CloudPanel VPS Initial Setup Script
#  Run as root on a fresh Ubuntu 24.04 VPS with CloudPanel
# =============================================================

echo "========================================="
echo "  ERPP.tech Server Setup"
echo "========================================="

# ---------- Variables ----------
DOMAIN="erpp.tech"
SITE_USER="erpp"
DB_NAME="erpp_db"
DB_USER="erpp_user"
DB_PASS=$(openssl rand -base64 18 | tr -dc 'A-Za-z0-9' | head -c 24)
APP_KEY_WILL_BE_GENERATED=true

SITE_ROOT="/home/${SITE_USER}/htdocs/${DOMAIN}"
BACKEND_DIR="/home/${SITE_USER}/htdocs/${DOMAIN}/backend"

echo ""
echo "Domain:    ${DOMAIN}"
echo "Site User: ${SITE_USER}"
echo "DB Name:   ${DB_NAME}"
echo "DB User:   ${DB_USER}"
echo "Site Root: ${SITE_ROOT}"
echo ""

# ---------- 1. Create CloudPanel Site ----------
echo "[1/8] Creating site in CloudPanel..."
if clpctl site:list 2>/dev/null | grep -q "${DOMAIN}"; then
    echo "  Site ${DOMAIN} already exists, skipping..."
else
    clpctl site:add:php \
        --domainName="${DOMAIN}" \
        --phpVersion="8.2" \
        --vhostTemplate="Laravel" \
        --siteUser="${SITE_USER}" \
        --siteUserPassword="$(openssl rand -base64 18)"
    echo "  Site created"
fi

# ---------- 2. Create Database ----------
echo ""
echo "[2/8] Creating database..."
if clpctl db:list 2>/dev/null | grep -q "${DB_NAME}"; then
    echo "  Database ${DB_NAME} already exists, skipping..."
else
    clpctl db:add \
        --domainName="${DOMAIN}" \
        --databaseName="${DB_NAME}" \
        --databaseUserName="${DB_USER}" \
        --databaseUserPassword="${DB_PASS}"
    echo "  Database created"
fi

# ---------- 3. Install Node.js 20 ----------
echo ""
echo "[3/8] Installing Node.js 20..."
if command -v node &>/dev/null && node -v | grep -q "v20"; then
    echo "  Node.js 20 already installed"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "  Node.js $(node -v) installed"
fi

# ---------- 4. Clone Repository ----------
echo ""
echo "[4/8] Cloning repository..."
if [ -d "${SITE_ROOT}/.git" ]; then
    echo "  Repo already cloned, pulling latest..."
    cd "${SITE_ROOT}"
    sudo -u "${SITE_USER}" git pull origin main
else
    # Clean default files
    rm -rf "${SITE_ROOT:?}"/*
    rm -rf "${SITE_ROOT:?}"/.[!.]* 2>/dev/null || true
    
    sudo -u "${SITE_USER}" git clone https://github.com/plankitdev/erpp.tech.git "${SITE_ROOT}"
    echo "  Repository cloned"
fi

# ---------- 5. Setup Backend ----------
echo ""
echo "[5/8] Setting up backend..."
cd "${BACKEND_DIR}"

sudo -u "${SITE_USER}" composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Create .env
sudo -u "${SITE_USER}" cp .env.example .env

# Configure .env for production
sudo -u "${SITE_USER}" sed -i "s|APP_NAME=.*|APP_NAME=ERPP|" .env
sudo -u "${SITE_USER}" sed -i "s|APP_ENV=.*|APP_ENV=production|" .env
sudo -u "${SITE_USER}" sed -i "s|APP_DEBUG=.*|APP_DEBUG=false|" .env
sudo -u "${SITE_USER}" sed -i "s|APP_URL=.*|APP_URL=https://${DOMAIN}|" .env
sudo -u "${SITE_USER}" sed -i "s|DB_CONNECTION=.*|DB_CONNECTION=mysql|" .env
sudo -u "${SITE_USER}" sed -i "s|.*DB_HOST=.*|DB_HOST=127.0.0.1|" .env
sudo -u "${SITE_USER}" sed -i "s|.*DB_PORT=.*|DB_PORT=3306|" .env
sudo -u "${SITE_USER}" sed -i "s|.*DB_DATABASE=.*|DB_DATABASE=${DB_NAME}|" .env
sudo -u "${SITE_USER}" sed -i "s|.*DB_USERNAME=.*|DB_USERNAME=${DB_USER}|" .env
sudo -u "${SITE_USER}" sed -i "s|.*DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|" .env
sudo -u "${SITE_USER}" sed -i "s|SESSION_DOMAIN=.*|SESSION_DOMAIN=.${DOMAIN}|" .env

# Add production-specific vars
cat >> "${BACKEND_DIR}/.env" << EOF

FRONTEND_URL=https://${DOMAIN}
SANCTUM_STATEFUL_DOMAINS=${DOMAIN},www.${DOMAIN}
SESSION_SECURE_COOKIE=true
EOF

# Generate app key
sudo -u "${SITE_USER}" php artisan key:generate --force

# Run migrations
sudo -u "${SITE_USER}" php artisan migrate --force

# Storage link
sudo -u "${SITE_USER}" php artisan storage:link 2>/dev/null || true

# Set permissions
chown -R "${SITE_USER}:${SITE_USER}" "${BACKEND_DIR}"
chmod -R 775 "${BACKEND_DIR}/storage"
chmod -R 775 "${BACKEND_DIR}/bootstrap/cache"

echo "  Backend setup complete"

# ---------- 6. Build Frontend ----------
echo ""
echo "[6/8] Building frontend..."
cd "${SITE_ROOT}/frontend"

sudo -u "${SITE_USER}" npm ci
sudo -u "${SITE_USER}" npm run build

echo "  Frontend built"

# ---------- 7. Setup Nginx Vhost ----------
echo ""
echo "[7/8] Configuring Nginx..."

VHOST_FILE="/etc/nginx/sites-enabled/${DOMAIN}.conf"

cat > "${VHOST_FILE}" << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root SITE_ROOT_PLACEHOLDER/frontend/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    # API / Backend (Laravel)
    location /backend {
        alias SITE_ROOT_PLACEHOLDER/backend/public;

        # Try files, then pass to Laravel
        try_files $uri $uri/ @backend;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.2-fpm-SITE_USER_PLACEHOLDER.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    location @backend {
        rewrite ^/backend/(.*)$ /backend/index.php?$query_string last;
    }

    # Storage files
    location /storage {
        alias SITE_ROOT_PLACEHOLDER/backend/storage/app/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Frontend static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend SPA — everything else goes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Block dotfiles
    location ~ /\. {
        deny all;
    }

    access_log /home/SITE_USER_PLACEHOLDER/logs/nginx/access.log;
    error_log /home/SITE_USER_PLACEHOLDER/logs/nginx/error.log;

    client_max_body_size 64M;
}
NGINXEOF

# Replace placeholders
sed -i "s|DOMAIN_PLACEHOLDER|${DOMAIN}|g" "${VHOST_FILE}"
sed -i "s|SITE_ROOT_PLACEHOLDER|${SITE_ROOT}|g" "${VHOST_FILE}"
sed -i "s|SITE_USER_PLACEHOLDER|${SITE_USER}|g" "${VHOST_FILE}"

# Create log directory
mkdir -p "/home/${SITE_USER}/logs/nginx"
chown -R "${SITE_USER}:${SITE_USER}" "/home/${SITE_USER}/logs"

echo "  Nginx configured"

# ---------- 8. SSL Certificate ----------
echo ""
echo "[8/8] Setting up SSL..."
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "  SSL certificate already exists"
else
    # Install certbot if needed
    if ! command -v certbot &>/dev/null; then
        apt-get install -y certbot
    fi
    
    # Stop nginx temporarily for standalone verification
    systemctl stop nginx 2>/dev/null || true
    
    certbot certonly --standalone \
        -d "${DOMAIN}" \
        -d "www.${DOMAIN}" \
        --non-interactive \
        --agree-tos \
        --email "plankitdev@gmail.com" || {
        echo "  WARNING: SSL cert failed. Make sure DNS points to this server!"
        echo "  You can retry later with: certbot certonly --standalone -d ${DOMAIN} -d www.${DOMAIN}"
        
        # Create self-signed cert as fallback
        mkdir -p "/etc/letsencrypt/live/${DOMAIN}"
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" \
            -out "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" \
            -subj "/CN=${DOMAIN}"
        echo "  Self-signed cert created as fallback"
    }
fi

# Test and restart Nginx
nginx -t && systemctl restart nginx
echo "  Nginx restarted"

# ---------- Done ----------
echo ""
echo "========================================="
echo "  SETUP COMPLETE!"
echo "========================================="
echo ""
echo "  Frontend: https://${DOMAIN}"
echo "  API:      https://${DOMAIN}/backend/api"
echo "  Panel:    https://$(hostname -I | awk '{print $1}'):8443"
echo ""
echo "  Database Credentials (SAVE THESE):"
echo "  DB Name:     ${DB_NAME}"
echo "  DB User:     ${DB_USER}"
echo "  DB Password: ${DB_PASS}"
echo ""
echo "========================================="
