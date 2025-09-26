<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'supplier_id',
        'phone',
        'active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'active' => 'boolean',
    ];

    // Relación con el rol
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    // Relación con los contenedores (para proveedores)
    public function containers()
    {
        return $this->hasMany(Container::class, 'supplier_id');
    }

    // Relación con las órdenes creadas
    public function createdOrders()
    {
        return $this->hasMany(Order::class, 'created_by');
    }

    // Relación con los seguimientos de contenedores actualizados
    public function containerTrackingUpdates()
    {
        return $this->hasMany(ContainerTracking::class, 'updated_by');
    }

    // Relación con los seguimientos de órdenes actualizados
    public function orderTrackingUpdates()
    {
        return $this->hasMany(OrderTracking::class, 'updated_by');
    }

    // Relación con proveedor
public function supplier()
{
    return $this->belongsTo(Supplier::class);
}

// Relación con contenedores creados
public function createdContainers()
{
    return $this->hasMany(Container::class, 'created_by');
}
}