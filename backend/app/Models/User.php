<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    /**
     * Relaciones
     */
    public function createdProjects()
    {
        return $this->hasMany(Project::class, 'created_by');
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_collaborators');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    public function assignedTasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function assignedToTasks()
    {
        return $this->belongsToMany(Task::class, 'task_assignments');
    }

    public function timeEntries()
    {
        return $this->hasMany(TimeEntry::class);
    }

    /**
     * Helpers
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isCollaborator(): bool
    {
        return $this->role === 'collaborator';
    }

    /**
     * JWT Methods
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->role,
            'name' => $this->name,
        ];
    }
}
