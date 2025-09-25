<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::create([
            'name' => 'Administrador',
            'email' => 'admin@polonorte.com',
            'password' => Hash::make('password'),
            'role_id' => 1, // Admin
            'phone' => '12345678',
        ]);

        // Operador user
        User::create([
            'name' => 'Operador',
            'email' => 'operador@polonorte.com',
            'password' => Hash::make('password'),
            'role_id' => 2, // Operador
            'phone' => '87654321',
        ]);

        // Proveedor user
        User::create([
            'name' => 'Proveedor China',
            'email' => 'proveedor@china.com',
            'password' => Hash::make('password'),
            'role_id' => 3, // Proveedor
            'phone' => '98765432',
        ]);
    }
}