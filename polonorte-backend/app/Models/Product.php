<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'code', 
        'description', 
        'category', 
        'price', 
        'min_stock', 
        'active'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'min_stock' => 'integer',
        'active' => 'boolean',
    ];

    // Relación con inventario
    public function inventory()
    {
        return $this->hasMany(Inventory::class);
    }

    // Relación con almacenes a través de inventario
    public function warehouses()
    {
        return $this->belongsToMany(Warehouse::class, 'inventory')
            ->withPivot('quantity')
            ->withTimestamps();
    }

    // Relación con órdenes
    public function orders()
    {
        return $this->belongsToMany(Order::class)
            ->withPivot('quantity', 'price', 'warehouse_id')
            ->withTimestamps();
    }
}