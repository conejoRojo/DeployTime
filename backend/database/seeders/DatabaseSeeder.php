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
        $admin = User::create([
            'name' => 'Administrador',
            'email' => 'admin@deploytime.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        // Crear colaboradores
        $colaborador1 = User::create([
            'name' => 'Juan Pérez',
            'email' => 'juan@deploytime.com',
            'password' => Hash::make('colaborador123'),
            'role' => 'collaborator',
        ]);

        $colaborador2 = User::create([
            'name' => 'María García',
            'email' => 'maria@deploytime.com',
            'password' => Hash::make('colaborador123'),
            'role' => 'collaborator',
        ]);

        // Crear proyectos
        $proyecto1 = Project::create([
            'name' => 'Sistema Web de Gestión',
            'description' => 'Desarrollo de sistema web para gestión de inventario',
            'created_by' => $admin->id,
        ]);

        $proyecto2 = Project::create([
            'name' => 'App Móvil E-commerce',
            'description' => 'Aplicación móvil para tienda online',
            'created_by' => $admin->id,
        ]);

        // Asignar colaboradores a proyectos
        $proyecto1->collaborators()->attach([$colaborador1->id, $colaborador2->id]);
        $proyecto2->collaborators()->attach([$colaborador1->id]);

        // Crear tareas para proyecto 1
        $tarea1 = Task::create([
            'project_id' => $proyecto1->id,
            'name' => 'Diseño de base de datos',
            'description' => 'Crear diagrama ER y estructura de BD',
            'estimated_hours' => 8.0,
            'status' => 'completed',
            'created_by' => $admin->id,
        ]);

        $tarea2 = Task::create([
            'project_id' => $proyecto1->id,
            'name' => 'Desarrollo API REST',
            'description' => 'Endpoints para CRUD de productos',
            'estimated_hours' => 16.0,
            'status' => 'in_progress',
            'created_by' => $colaborador1->id,
        ]);

        $tarea3 = Task::create([
            'project_id' => $proyecto1->id,
            'name' => 'Frontend React',
            'description' => 'Componentes y vistas principales',
            'estimated_hours' => 24.0,
            'status' => 'pending',
            'created_by' => $colaborador2->id,
        ]);

        // Crear tareas para proyecto 2
        $tarea4 = Task::create([
            'project_id' => $proyecto2->id,
            'name' => 'Configuración inicial Flutter',
            'description' => 'Setup del proyecto y dependencias',
            'estimated_hours' => 4.0,
            'status' => 'completed',
            'created_by' => $colaborador1->id,
        ]);

        // Crear entradas de tiempo
        TimeEntry::create([
            'task_id' => $tarea1->id,
            'user_id' => $admin->id,
            'start_time' => now()->subDays(3)->setTime(9, 0),
            'end_time' => now()->subDays(3)->setTime(13, 30),
            'notes' => 'Diseño inicial completado',
        ]);

        TimeEntry::create([
            'task_id' => $tarea1->id,
            'user_id' => $admin->id,
            'start_time' => now()->subDays(2)->setTime(10, 0),
            'end_time' => now()->subDays(2)->setTime(14, 0),
            'notes' => 'Revisión y ajustes finales',
        ]);

        TimeEntry::create([
            'task_id' => $tarea2->id,
            'user_id' => $colaborador1->id,
            'start_time' => now()->subDays(1)->setTime(9, 0),
            'end_time' => now()->subDays(1)->setTime(18, 0),
            'notes' => 'Desarrollo de endpoints de productos',
        ]);

        TimeEntry::create([
            'task_id' => $tarea2->id,
            'user_id' => $colaborador1->id,
            'start_time' => now()->setTime(9, 0),
            'end_time' => null, // Entrada activa
            'notes' => 'Continuando con desarrollo de API',
        ]);

        TimeEntry::create([
            'task_id' => $tarea4->id,
            'user_id' => $colaborador1->id,
            'start_time' => now()->subDays(5)->setTime(14, 0),
            'end_time' => now()->subDays(5)->setTime(18, 0),
            'notes' => 'Setup completo de Flutter',
        ]);

        $this->command->info('Base de datos poblada correctamente');
        $this->command->info('');
        $this->command->info('Credenciales de acceso:');
        $this->command->info('------------------------------');
        $this->command->info('Admin:');
        $this->command->info('  Email: admin@deploytime.com');
        $this->command->info('  Password: admin123');
        $this->command->info('');
        $this->command->info('Colaborador 1:');
        $this->command->info('  Email: juan@deploytime.com');
        $this->command->info('  Password: colaborador123');
        $this->command->info('');
        $this->command->info('Colaborador 2:');
        $this->command->info('  Email: maria@deploytime.com');
        $this->command->info('  Password: colaborador123');
    }
}
