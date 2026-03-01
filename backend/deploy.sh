#!/bin/bash
# Script de auto-despliegue local para cPanel Git Version Control

echo "Iniciando despliegue de DeployTime..."

# 1. Instalar dependencias de PHP sin interactividad y optimizar clases
composer install --no-dev --optimize-autoloader

# 2. Asegurar que las carpetas de caché existen
mkdir -p bootstrap/cache
chmod -R 775 bootstrap/cache

# 3. Mantenimiento y migraciones de Laravel
php artisan down || true

php artisan migrate --force

# 4. Limpiar y reconstruir cachés estructurales
php artisan config:cache
php artisan route:cache
php artisan view:cache

php artisan up

echo "Despliegue finalizado exitosamente."
