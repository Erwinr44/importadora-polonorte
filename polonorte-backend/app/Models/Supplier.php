<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'contact_person',
        'email',
        'phone',
        'address',
        'country',
        'tax_id',
        'active'
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    // Relación con usuarios (empleados del proveedor)
    public function users()
    {
        return $this->hasMany(User::class);
    }

    // Relación con contenedores
    public function containers()
    {
        return $this->hasMany(Container::class);
    }
}