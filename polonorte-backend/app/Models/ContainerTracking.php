<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContainerTracking extends Model
{
    use HasFactory;

    protected $table = 'container_tracking';

    protected $fillable = ['container_id', 'status', 'location', 'notes', 'updated_by'];

    // Relación con contenedor
    public function container()
    {
        return $this->belongsTo(Container::class);
    }

    // Relación con el usuario que actualizó
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}