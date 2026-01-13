#!/bin/sh
set -e

# Ensure directories exist and have correct ownership
mkdir -p /var/www/bootstrap/cache
chown -R www-data:www-data /var/www/bootstrap/cache || true
mkdir -p /var/www/vendor
chown -R www-data:www-data /var/www/vendor || true

# If vendor is empty, run composer install (useful when using named volume)
if [ ! -d /var/www/vendor ] || [ -z "$(ls -A /var/www/vendor 2>/dev/null)" ]; then
  echo "Vendor empty — running composer install..."
  composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# Execute the container CMD
exec "$@"
