<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Unidad de medida del producto (unidad, caja, paca, libra, kilo, etc.)
            $table->string('unit_type')->default('unidad')->after('price');
            
            // Peso/medida unitaria (por ejemplo: cada paca pesa 1000 libras)
            $table->decimal('unit_weight', 10, 2)->nullable()->after('unit_type');
            
            // Tipo de peso/medida (libras, kilos, gramos, etc.)
            $table->string('weight_unit')->nullable()->after('unit_weight');
        });

        // Actualizar productos existentes con valores por defecto
        DB::table('products')->update([
            'unit_type' => 'unidad',
            'unit_weight' => null,
            'weight_unit' => null
        ]);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['unit_type', 'unit_weight', 'weight_unit']);
        });
    }
};