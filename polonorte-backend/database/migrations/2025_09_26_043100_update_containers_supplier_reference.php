<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('containers', function (Blueprint $table) {
            // Eliminar la foreign key actual
            $table->dropForeign(['supplier_id']);
            
            // Agregar referencia al usuario que creó el furgón
            $table->foreignId('created_by')->nullable()->after('supplier_id')->constrained('users')->onDelete('set null');
            
            // Recrear la foreign key para que apunte a suppliers
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('containers', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropForeign(['created_by']);
            $table->dropColumn('created_by');
            
            // Restaurar referencia original a users
            $table->foreign('supplier_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};