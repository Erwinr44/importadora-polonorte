<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Container;
use App\Models\ContainerTracking;
use Illuminate\Support\Str;

class ContainerSeeder extends Seeder
{
    public function run(): void
    {
        // Crear un furgón de ejemplo
        $container = Container::create([
            'tracking_code' => 'CONT-' . strtoupper(Str::random(8)),
            'supplier_id' => 3, // ID del usuario proveedor
            'origin_country' => 'China',
            'content_description' => 'Juguetes y peluches variados',
            'departure_date' => now()->subDays(30),
            'expected_arrival_date' => now()->addDays(15),
            'status' => 'En tránsito',
        ]);
        
        // Crear registros de seguimiento
        ContainerTracking::create([
            'container_id' => $container->id,
            'status' => 'Registrado',
            'location' => 'Shanghai, China',
            'notes' => 'Furgón registrado en el sistema',
            'updated_by' => 1, // Admin
        ]);
        
        ContainerTracking::create([
            'container_id' => $container->id,
            'status' => 'En preparación',
            'location' => 'Shanghai, China',
            'notes' => 'Carga en preparación',
            'updated_by' => 3, // Proveedor
        ]);
        
        ContainerTracking::create([
            'container_id' => $container->id,
            'status' => 'En tránsito',
            'location' => 'Océano Pacífico',
            'notes' => 'Furgón en ruta hacia Guatemala',
            'updated_by' => 3, // Proveedor
        ]);
    }
}