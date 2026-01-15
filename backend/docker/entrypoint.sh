#!/bin/bash
set -e

echo "🚀 Starting application setup..."

# 1. Ensure directories exist
mkdir -p /var/www/bootstrap/cache
mkdir -p /var/www/storage/framework/cache
mkdir -p /var/www/storage/framework/sessions
mkdir -p /var/www/storage/framework/views
mkdir -p /var/www/storage/logs

# 2. Fix permissions (try chown, fallback to chmod for Windows/Bind mounts)
echo "🔒 Fixing permissions..."
chown -R www-data:www-data /var/www/bootstrap/cache /var/www/storage /var/www/vendor 2>/dev/null || true
chmod -R 777 /var/www/bootstrap/cache /var/www/storage /var/www/vendor 2>/dev/null || true

# 3. Check/Install Dependencies
if [ ! -d /var/www/vendor ] || [ -z "$(ls -A /var/www/vendor 2>/dev/null)" ]; then
    echo "📦 Vendor directory empty. Installing dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
else
    echo "✅ Dependencies already installed."
fi

# 4. Wait for MySQL to be ready
echo "⏳ Waiting for MySQL connection..."
until nc -z -v -w30 "$DB_HOST" "$DB_PORT"; do
  echo "Waiting for database connection at $DB_HOST:$DB_PORT..."
  sleep 2
done
echo "✅ MySQL is ready!"

# 5. Generate Key if missing
if [ -f .env ]; then
    if grep -q "APP_KEY=" .env && [ -z "$(grep "APP_KEY=" .env | cut -d '=' -f2)" ]; then
        echo "🔑 Generating application key..."
        php artisan key:generate
    fi
fi

# 6. Execute the CMD
echo "🏁 Starting server..."
exec "$@"
