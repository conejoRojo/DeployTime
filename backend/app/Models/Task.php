<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'description',
        'estimated_hours',
        'status',
        'created_by',
        'assigned_to',
    ];

    protected $casts = [
        'estimated_hours' => 'decimal:2',
    ];

    /**
     * Relaciones
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'task_assignments');
    }

    public function timeEntries()
    {
        return $this->hasMany(TimeEntry::class);
    }

    /**
     * Helpers
     */
    public function totalTimeSpent()
    {
        return $this->timeEntries->sum(function ($entry) {
            if ($entry->end_time) {
                return $entry->end_time->diffInSeconds($entry->start_time);
            }
            return 0;
        });
    }

    public function totalTimeSpentInHours()
    {
        return round($this->totalTimeSpent() / 3600, 2);
    }

    public function isOverEstimate()
    {
        if (!$this->estimated_hours) {
            return false;
        }
        return $this->totalTimeSpentInHours() > $this->estimated_hours;
    }
}
