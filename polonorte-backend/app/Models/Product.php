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
        'unit_type',      // NUEVO
        'unit_weight',    // NUEVO
        'weight_unit',    // NUEVO
        'min_stock', 
        'active'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'unit_weight' => 'decimal:2',  // NUEVO
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

    // NUEVO: Método para obtener la descripción completa de la unidad
    public function getUnitDescriptionAttribute()
    {
        if ($this->unit_weight && $this->weight_unit) {
            return "{$this->unit_type} ({$this->unit_weight} {$this->weight_unit})";
        }
        return $this->unit_type;
    }

    // NUEVO: Método para calcular el peso total basado en cantidad
    public function calculateTotalWeight($quantity)
    {
        if ($this->unit_weight) {
            return $quantity * $this->unit_weight;
        }
        return null;
    }
}