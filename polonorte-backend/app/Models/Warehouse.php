<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'location', 'description', 'active'];

    protected $casts = [
        'active' => 'boolean',
    ];

    // Relación con inventario
    public function inventory()
    {
        return $this->hasMany(Inventory::class);
    }

    // Relación con productos a través de inventario
    public function products()
    {
        return $this->belongsToMany(Product::class, 'inventory')
            ->withPivot('quantity')
            ->withTimestamps();
    }
}