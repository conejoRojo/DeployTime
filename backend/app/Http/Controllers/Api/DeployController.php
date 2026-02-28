<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class DeployController extends Controller
{
    public function handle(Request $request)
    {
        // 1. Verificación de Seguridad extrema
        $expectedToken = env('DEPLOY_TOKEN');
        $providedToken = $request->header('X-Deploy-Token') ?? $request->input('token');

        if (empty($expectedToken)) {
            Log::error('Intento de despliegue fallido: DEPLOY_TOKEN no está configurado en el servidor.');
            return response()->json(['error' => 'Configuration error on server.'], 500);
        }

        if (!hash_equals($expectedToken, (string) $providedToken)) {
            Log::warning('Intento de despliegue no autorizado repeliendo IP: ' . $request->ip());
            return response()->json(['error' => 'Unauthorized. Invalid Token.'], 401);
        }

        // 2. Ejecución Segura de Comandos
        try {
            Log::info('Iniciando script de autodespliegue vía Webhook...');
            $output = [];

            Artisan::call('migrate', ['--force' => true]);
            $output['migrate'] = Artisan::output();

            Artisan::call('config:cache');
            $output['config_cache'] = Artisan::output();

            Artisan::call('route:cache');
            $output['route_cache'] = Artisan::output();

            Artisan::call('view:cache');
            $output['view_cache'] = Artisan::output();

            Log::info('Despliegue completado con éxito.');

            return response()->json([
                'status' => 'success',
                'message' => 'Deployment executed successfully.',
                'details' => $output
            ]);

        } catch (\Exception $e) {
            Log::error('Error crítico durante el despliegue: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Deployment failed.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
