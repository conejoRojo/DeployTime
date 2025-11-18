@echo off
echo ====================================
echo DeployTime Backend Setup
echo ====================================
echo.

echo [1/4] Installing Composer dependencies...
docker run --rm -v "%cd%:/app" -w /app composer:latest install --no-interaction --prefer-dist --optimize-autoloader

echo.
echo [2/4] Generating application key...
docker run --rm -v "%cd%:/app" -w /app php:8.3-cli php artisan key:generate

echo.
echo [3/4] Running migrations...
docker run --rm -v "%cd%:/app" -w /app --network backend_deploytime_network php:8.3-cli php artisan migrate --force

echo.
echo [4/4] Setup completed!
echo.
echo You can now access:
echo - API: http://localhost:8000
echo - phpMyAdmin: http://localhost:8080
echo.
pause
