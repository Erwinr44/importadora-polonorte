<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Agregar índices a las tablas para mejorar el rendimiento
     * de las consultas más frecuentes
     */
    public function up(): void
    {
        // Índices para la tabla products
        Schema::table('products', function (Blueprint $table) {
            $table->index('active', 'idx_products_active');
            $table->index('category', 'idx_products_category');
            $table->index(['active', 'category'], 'idx_products_active_category');
        });
        
        // Índices para la tabla orders
        Schema::table('orders', function (Blueprint $table) {
            $table->index('status', 'idx_orders_status');
            $table->index('created_at', 'idx_orders_created_at');
            $table->index('created_by', 'idx_orders_created_by');
            $table->index(['status', 'created_at'], 'idx_orders_status_created');
        });
        
        // Índices para la tabla containers
        Schema::table('containers', function (Blueprint $table) {
            $table->index('status', 'idx_containers_status');
            $table->index('supplier_id', 'idx_containers_supplier_id');
            $table->index('created_at', 'idx_containers_created_at');
            $table->index(['status', 'supplier_id'], 'idx_containers_status_supplier');
        });
        
        // Índices para la tabla inventory
        Schema::table('inventory', function (Blueprint $table) {
            $table->index('product_id', 'idx_inventory_product_id');
            $table->index('warehouse_id', 'idx_inventory_warehouse_id');
            $table->index('quantity', 'idx_inventory_quantity');
        });
        
        // Índices para la tabla warehouses
        Schema::table('warehouses', function (Blueprint $table) {
            $table->index('active', 'idx_warehouses_active');
        });
        
        // Índices para la tabla users
        Schema::table('users', function (Blueprint $table) {
            $table->index('role_id', 'idx_users_role_id');
            $table->index('active', 'idx_users_active');
            $table->index(['active', 'role_id'], 'idx_users_active_role');
        });
        
        // Índices para la tabla order_tracking
        Schema::table('order_tracking', function (Blueprint $table) {
            $table->index('order_id', 'idx_order_tracking_order_id');
            $table->index('created_at', 'idx_order_tracking_created_at');
        });
        
        // Índices para la tabla container_tracking
        Schema::table('container_tracking', function (Blueprint $table) {
            $table->index('container_id', 'idx_container_tracking_container_id');
            $table->index('created_at', 'idx_container_tracking_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Eliminar índices de products
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_active');
            $table->dropIndex('idx_products_category');
            $table->dropIndex('idx_products_active_category');
        });
        
        // Eliminar índices de orders
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_status');
            $table->dropIndex('idx_orders_created_at');
            $table->dropIndex('idx_orders_created_by');
            $table->dropIndex('idx_orders_status_created');
        });
        
        // Eliminar índices de containers
        Schema::table('containers', function (Blueprint $table) {
            $table->dropIndex('idx_containers_status');
            $table->dropIndex('idx_containers_supplier_id');
            $table->dropIndex('idx_containers_created_at');
            $table->dropIndex('idx_containers_status_supplier');
        });
        
        // Eliminar índices de inventory
        Schema::table('inventory', function (Blueprint $table) {
            $table->dropIndex('idx_inventory_product_id');
            $table->dropIndex('idx_inventory_warehouse_id');
            $table->dropIndex('idx_inventory_quantity');
        });
        
        // Eliminar índices de warehouses
        Schema::table('warehouses', function (Blueprint $table) {
            $table->dropIndex('idx_warehouses_active');
        });
        
        // Eliminar índices de users
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role_id');
            $table->dropIndex('idx_users_active');
            $table->dropIndex('idx_users_active_role');
        });
        
        // Eliminar índices de order_tracking
        Schema::table('order_tracking', function (Blueprint $table) {
            $table->dropIndex('idx_order_tracking_order_id');
            $table->dropIndex('idx_order_tracking_created_at');
        });
        
        // Eliminar índices de container_tracking
        Schema::table('container_tracking', function (Blueprint $table) {
            $table->dropIndex('idx_container_tracking_container_id');
            $table->dropIndex('idx_container_tracking_created_at');
        });
    }
};