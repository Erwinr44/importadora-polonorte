<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Inventory;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Crear algunos productos de ejemplo
        $products = [
            [
                'name' => 'Pacas de ropa',
                'code' => 'PACA001',
                'description' => 'Pacas de ropa usada importada',
                'category' => 'Ropa',
                'price' => 1200.00,
                'min_stock' => 10,
            ],
            [
                'name' => 'Zapatos deportivos',
                'code' => 'ZAP001',
                'description' => 'Zapatos deportivos de diferentes marcas',
                'category' => 'Calzado',
                'price' => 450.00,
                'min_stock' => 20,
            ],
            [
                'name' => 'Juguetes surtidos',
                'code' => 'JUG001',
                'description' => 'Juguetes de plástico para niños',
                'category' => 'Juguetes',
                'price' => 250.00,
                'min_stock' => 30,
            ],
            [
                'name' => 'Peluches',
                'code' => 'PEL001',
                'description' => 'Peluches de diferentes tamaños',
                'category' => 'Juguetes',
                'price' => 150.00,
                'min_stock' => 25,
            ],
        ];

        foreach ($products as $productData) {
            $product = Product::create($productData);
            
            // Añadir inventario inicial en las bodegas
            Inventory::create([
                'product_id' => $product->id,
                'warehouse_id' => 1, // Bodega Central
                'quantity' => rand(50, 100),
            ]);
            
            Inventory::create([
                'product_id' => $product->id,
                'warehouse_id' => 2, // Bodega Sur
                'quantity' => rand(20, 50),
            ]);
        }
    }
}