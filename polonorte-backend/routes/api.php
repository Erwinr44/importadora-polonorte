<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\InventoryController;
use App\Http\Controllers\API\WarehouseController;
use App\Http\Controllers\API\ContainerController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\DashboardController;

// Ruta de prueba (para verificar que la API funciona)
Route::get('/test', function () {
    return response()->json(['message' => 'API funcionando correctamente']);
});

// ============================================
// RUTAS PÚBLICAS - Rate Limit: 10 por minuto
// ============================================
Route::middleware('throttle:10,1')->group(function () {
    // Login - limitado para prevenir fuerza bruta
    Route::post('/login', [AuthController::class, 'login']);
    
    // Seguimiento público (para clientes externos)
    Route::get('/orders/track/{trackingCode}', [OrderController::class, 'trackByCode']);
    Route::get('/containers/track/{trackingCode}', [ContainerController::class, 'trackByCode']);
});

// ============================================
// RUTAS PROTEGIDAS - Rate Limit: 120 por minuto
// ============================================
Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {
    
    // Rutas de autenticación
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Dashboard optimizado
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
    Route::get('/dashboard/low-stock', [DashboardController::class, 'getLowStockProducts']);
    
    // Rutas para productos - solo Admin y Operador
    Route::middleware('role:Admin,Operador')->group(function () {
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::get('/products/{id}', [ProductController::class, 'show']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
        Route::get('/unit-types', [ProductController::class, 'getUnitTypes']);
    });
    
    // Rutas para bodegas - solo Admin y Operador
    Route::middleware('role:Admin,Operador')->group(function () {
        Route::get('/warehouses', [WarehouseController::class, 'index']);
        Route::post('/warehouses', [WarehouseController::class, 'store']);
        Route::get('/warehouses/{id}', [WarehouseController::class, 'show']);
        Route::put('/warehouses/{id}', [WarehouseController::class, 'update']);
        Route::delete('/warehouses/{id}', [WarehouseController::class, 'destroy']);
    });
    
    // Rutas para inventario - solo Admin y Operador
    Route::middleware('role:Admin,Operador')->group(function () {
        Route::get('/inventory', [InventoryController::class, 'index']);
        Route::get('/inventory/product/{productId}', [InventoryController::class, 'getProductInventory']);
        Route::get('/inventory/warehouse/{warehouseId}', [InventoryController::class, 'getWarehouseInventory']);
        Route::post('/inventory/update-quantity', [InventoryController::class, 'updateQuantity']);
        Route::post('/inventory/transfer', [InventoryController::class, 'transferInventory']);
    });
    
    // Rutas para furgones
    Route::get('/containers', [ContainerController::class, 'index']);
    Route::get('/containers/{id}', [ContainerController::class, 'show']);
    
    // Permitir a los proveedores crear furgones
    Route::post('/containers', [ContainerController::class, 'store']);
    
    // Solo Admin y Operador pueden editar furgones
    Route::middleware('role:Admin,Operador')->group(function () {
        Route::put('/containers/{id}', [ContainerController::class, 'update']);
    });
    
    // Todos los roles autenticados pueden actualizar estado
    Route::post('/containers/{id}/update-status', [ContainerController::class, 'updateStatus']);
    
    // Rutas para pedidos - solo Admin y Operador
    Route::middleware('role:Admin,Operador')->group(function () {
        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
        Route::post('/orders/{id}/update-status', [OrderController::class, 'updateStatus']);
    });

    // Rutas para gestión de usuarios (solo Admin)
    Route::middleware('role:Admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::post('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::get('/roles', [UserController::class, 'getRoles']);
    });

    // Ruta para obtener proveedores - solo Admin y Operador
    Route::middleware('role:Admin,Operador')->group(function () {
        Route::get('/container-suppliers', [ContainerController::class, 'getSuppliers']);
    });
});