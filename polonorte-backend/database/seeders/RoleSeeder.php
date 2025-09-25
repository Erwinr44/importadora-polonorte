<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::create(['name' => 'Admin', 'description' => 'Administrador del sistema']);
        Role::create(['name' => 'Operador', 'description' => 'Operador de inventario y pedidos']);
        Role::create(['name' => 'Proveedor', 'description' => 'Proveedor que actualiza estado de contenedores']);
    }
}