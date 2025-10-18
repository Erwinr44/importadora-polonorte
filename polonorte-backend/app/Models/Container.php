<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Container extends Model
{
    use HasFactory;

    protected $fillable = [
        'tracking_code', 
        'supplier_id', 
        'origin_country', 
        'content_description', 
        'departure_date', 
        'expected_arrival_date', 
        'actual_arrival_date', 
        'status',
        'created_by'
    ];

    protected $casts = [
        'departure_date' => 'date',
        'expected_arrival_date' => 'date',
        'actual_arrival_date' => 'date',
    ];

    // Relación con proveedor
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    // Relación con el usuario que lo creó
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Relación con el historial de seguimiento
    public function trackingHistory()
    {
        return $this->hasMany(ContainerTracking::class);
    }
}