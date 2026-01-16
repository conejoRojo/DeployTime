<?php

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_users' => User::count(),
            'total_projects' => Project::count(),
            'total_tasks' => Task::count(),
            'pending_tasks' => Task::where('status', 'pending')->count(),
        ];

        return view('admin.dashboard', compact('stats'));
    }
}
