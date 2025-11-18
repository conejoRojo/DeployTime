#!/bin/bash

# Esperar a que MySQL esté listo
echo "Esperando MySQL..."
sleep 5

# Ejecutar migraciones si es necesario
#php artisan migrate --force

# Iniciar servidor Laravel
php artisan serve --host=0.0.0.0 --port=8000
