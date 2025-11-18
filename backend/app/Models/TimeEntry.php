<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimeEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'start_time',
        'end_time',
        'notes',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    /**
     * Relaciones
     */
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helpers
     */
    public function durationInSeconds()
    {
        if (!$this->end_time) {
            return now()->diffInSeconds($this->start_time);
        }
        return $this->end_time->diffInSeconds($this->start_time);
    }

    public function durationInHours()
    {
        return round($this->durationInSeconds() / 3600, 2);
    }

    public function durationFormatted()
    {
        $seconds = $this->durationInSeconds();
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $secs = $seconds % 60;

        return sprintf('%02d:%02d:%02d', $hours, $minutes, $secs);
    }

    public function isActive()
    {
        return $this->end_time === null;
    }
}
