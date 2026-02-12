<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Crear usuario administrador
        $admin = User::firstOrCreate(
            ['email' => 'admin@deploytime.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );

        // Crear colaboradores
        $colaborador1 = User::firstOrCreate(
            ['email' => 'juan@deploytime.com'],
            [
                'name' => 'Juan Pérez',
                'password' => Hash::make('colaborador123'),
                'role' => 'collaborator',
            ]
        );

        $colaborador2 = User::firstOrCreate(
            ['email' => 'maria@deploytime.com'],
            [
                'name' => 'María García',
                'password' => Hash::make('colaborador123'),
                'role' => 'collaborator',
            ]
        );

        // Nuevos usuarios solicitados
        $luis = User::firstOrCreate(
            ['email' => 'luis@dixer.net'],
            [
                'name' => 'Luis Admin',
                'password' => Hash::make('#Mexico1986'),
                'role' => 'admin',
            ]
        );

        $martin = User::firstOrCreate(
            ['email' => 'martin@dixer.net'],
            [
                'name' => 'Martin',
                'password' => Hash::make('R2D2arturito'),
                'role' => 'admin',
            ]
        );

        $lautaro = User::firstOrCreate(
            ['email' => 'lautaro@dixer.net'],
            [
                'name' => 'Lautaro',
                'password' => Hash::make('R2D2arturito'),
                'role' => 'collaborator',
            ]
        );


        // Crear proyectos
        $proyecto1 = Project::firstOrCreate(
            ['name' => 'Sistema Web de Gestión'],
            [
                'description' => 'Desarrollo de sistema web para gestión de inventario',
                'created_by' => $admin->id,
            ]
        );

        $proyecto2 = Project::firstOrCreate(
            ['name' => 'App Móvil E-commerce'],
            [
                'description' => 'Aplicación móvil para tienda online',
                'created_by' => $admin->id,
            ]
        );

        // Asignar colaboradores a proyectos
        // Usamos syncWithoutDetaching para evitar duplicados en pivote
        $proyecto1->collaborators()->syncWithoutDetaching([$colaborador1->id, $colaborador2->id, $lautaro->id]);
        $proyecto2->collaborators()->syncWithoutDetaching([$colaborador1->id, $lautaro->id]);

        // Crear tareas para proyecto 1
        $tarea1 = Task::firstOrCreate(
            ['name' => 'Diseño de base de datos', 'project_id' => $proyecto1->id],
            [
                'description' => 'Crear diagrama ER y estructura de BD',
                'estimated_hours' => 8.0,
                'status' => 'completed',
                'created_by' => $admin->id,
            ]
        );

        // Asignar tarea a Lautaro para que la vea
        $tarea1->assignedUsers()->syncWithoutDetaching([$lautaro->id]);

        // ... (resto de tareas si se desea, pero con esto basta para demo)
        
        $this->command->info('Base de datos poblada/actualizada correctamente.');
    }
}
