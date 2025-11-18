<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'created_by',
    ];

    /**
     * Relaciones
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function collaborators()
    {
        return $this->belongsToMany(User::class, 'project_collaborators');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Helpers
     */
    public function totalTimeSpent()
    {
        return $this->tasks()
            ->with('timeEntries')
            ->get()
            ->sum(function ($task) {
                return $task->timeEntries->sum(function ($entry) {
                    if ($entry->end_time) {
                        return $entry->end_time->diffInSeconds($entry->start_time);
                    }
                    return 0;
                });
            });
    }
}
