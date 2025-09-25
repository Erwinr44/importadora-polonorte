<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        Warehouse::create([
            'name' => 'Bodega Central',
            'location' => 'Ciudad de Guatemala',
            'description' => 'Bodega principal para distribución nacional',
        ]);

        Warehouse::create([
            'name' => 'Bodega Sur',
            'location' => 'Escuintla',
            'description' => 'Bodega secundaria para distribución regional',
        ]);
    }
}