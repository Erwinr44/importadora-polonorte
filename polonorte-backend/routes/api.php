<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\InventoryController;
use App\Http\Controllers\API\WarehouseController;
use App\Http\Controllers\API\ContainerController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\SupplierController;

// Ruta de prueba (para verificar que la API funciona)
Route::get('/test', function () {
    return response()->json(['message' => 'API funcionando correctamente']);
});

// Rutas públicas (no requieren autenticación)
Route::post('/login', [AuthController::class, 'login']);

// Rutas públicas para seguimiento
Route::get('/orders/track/{trackingCode}', [OrderController::class, 'trackByCode']);
Route::get('/containers/track/{trackingCode}', [ContainerController::class, 'trackByCode']);

// Rutas protegidas (requieren autenticación)
Route::middleware('auth:sanctum')->group(function () {
    // Rutas de autenticación
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Rutas para productos - solo Admin y Operador
    Route::middleware('role:Admin,Operador')->group(function () {
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::get('/products/{id}', [ProductController::class, 'show']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
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
        
        // 🆕 NUEVA RUTA: Obtener productos con stock bajo
        Route::get('/inventory/low-stock', [InventoryController::class, 'getLowStockProducts']);
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
    Route::middleware('role:Admin,Operador')->group(function () {
    Route::get('/container-suppliers', [ContainerController::class, 'getSuppliers']);
    });

// Rutas para pedidos - solo Admin y Operador
Route::middleware('role:Admin,Operador')->group(function () {
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/update-status', [OrderController::class, 'updateStatus']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']); // NUEVA RUTA
});

    // Rutas para gestión de usuarios (solo Admin)
Route::middleware('role:Admin')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::post('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
    Route::get('/roles', [UserController::class, 'getRoles']);
    Route::get('/user-suppliers', [UserController::class, 'getSuppliers']);
    
    // Gestión de contraseñas
    Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
    Route::post('/users/{id}/generate-temp-password', [UserController::class, 'generateTempPassword']);
});

// Rutas para gestión de proveedores (solo Admin)
Route::middleware('role:Admin')->group(function () {
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::get('/suppliers/{id}', [SupplierController::class, 'show']);
    Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);
    Route::post('/suppliers/{id}/toggle-status', [SupplierController::class, 'toggleStatus']);
});

    // Ruta para obtener proveedores - solo Admin y Operador
    Route::middleware('role:Admin,Operador')->group(function () {
        Route::get('/container-suppliers', [ContainerController::class, 'getSuppliers']);
    });

    // Rutas para gestión de usuarios (solo Admin)
Route::middleware('role:Admin')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::post('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
    Route::get('/roles', [UserController::class, 'getRoles']);
    
    // Gestión de contraseñas (Solo Admin)
    Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
    Route::post('/users/{id}/generate-temp-password', [UserController::class, 'generateTempPassword']);
});

// Ruta para que usuarios cambien su propia contraseña (todos los roles autenticados)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/change-password', [UserController::class, 'changeOwnPassword']);
});

    
});