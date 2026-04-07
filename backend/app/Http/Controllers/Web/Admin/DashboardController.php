<?php

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\TimeEntry;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Horas trabajadas hoy
        $secondsToday = TimeEntry::whereDate('start_time', Carbon::today())
            ->whereNotNull('end_time')
            ->get()
            ->sum(function($entry) {
                return $entry->durationInSeconds();
            });
            
        // Los timers activos también suman al hoy (hasta el momento actual)
        $activeSecondsToday = TimeEntry::whereDate('start_time', Carbon::today())
            ->whereNull('end_time')
            ->get()
            ->sum(function($entry) {
                return $entry->start_time->diffInSeconds(now());
            });
            
        $totalHoursToday = round(($secondsToday + $activeSecondsToday) / 3600, 1);

        $stats = [
            'total_users' => User::count(),
            'total_projects' => Project::count(),
            'total_tasks' => Task::count(),
            'pending_tasks' => Task::where('status', 'pending')->count(),
            'hours_today' => $totalHoursToday
        ];

        // Últimas 5 sesiones (entradas de tiempo)
        $recentActivity = TimeEntry::with(['user', 'task.project'])
            ->orderBy('start_time', 'desc')
            ->take(5)
            ->get();

        return view('admin.dashboard', compact('stats', 'recentActivity'));
    }
}
