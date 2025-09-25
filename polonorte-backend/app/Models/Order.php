<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'tracking_code', 
        'customer_name', 
        'customer_phone', 
        'customer_email', 
        'total_amount', 
        'status', 
        'notes', 
        'created_by'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    // Relación con el usuario que creó la orden
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Relación con productos
    public function products()
    {
        return $this->belongsToMany(Product::class)
            ->withPivot('quantity', 'price', 'warehouse_id')
            ->withTimestamps();
    }

    // Relación con el historial de seguimiento
    public function trackingHistory()
    {
        return $this->hasMany(OrderTracking::class);
    }
}