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
        $totalSeconds = $this->timeEntries->reduce(function ($carry, $entry) {
            $start = \Carbon\Carbon::parse($entry->start_time);
            $end = $entry->end_time ? \Carbon\Carbon::parse($entry->end_time) : now();
            
            // Usar valor absoluto diffInSeconds devuelve absoluto por defecto, pero forzamos asegurar positivo
            return $carry + abs($end->diffInSeconds($start));
        }, 0);

        return $totalSeconds;
    }

    public function totalTimeSpentInHours()
    {
        return round($this->totalTimeSpent() / 3600, 2);
    }

    public function totalTimeSpentFormatted()
    {
        $seconds = $this->totalTimeSpent();
        // Asegurar no negativos
        $seconds = max(0, $seconds);
        
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds / 60) % 60);
        $secs = $seconds % 60;

        return sprintf('%02d:%02d:%02d', $hours, $minutes, $secs);
    }

    public function isOverEstimate()
    {
        if (!$this->estimated_hours) {
            return false;
        }
        return $this->totalTimeSpentInHours() > $this->estimated_hours;
    }
}
