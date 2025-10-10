<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\InventoryController;
use App\Http\Controllers\API\WarehouseController;
use App\Http\Controllers\API\ContainerController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\SettingController;


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
    });
    
    // Rutas para furgones
    Route::get('/containers', [ContainerController::class, 'index']);
    Route::get('/containers/{id}', [ContainerController::class, 'show']);
    // Permitir a los proveedores crear furgones
    Route::post('/containers', [ContainerController::class, 'store']);
    // Solo Admin y Operador pueden editar y eliminar
    Route::middleware('role:Admin,Operador')->group(function () {
        Route::put('/containers/{id}', [ContainerController::class, 'update']);
        Route::delete('/containers/{id}', [ContainerController::class, 'destroy']);
    });
    // Actualizar estado (proveedor, admin, operador)
    Route::post('/containers/{id}/update-status', [ContainerController::class, 'updateStatus']);
    // Proveedores que pueden gestionar contenedores
    Route::get('/container-suppliers', [ContainerController::class, 'getSuppliers']);
    
    // Rutas para pedidos - solo Admin y Operador
    Route::middleware('role:Admin,Operador')->group(function () {
        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
        Route::put('/orders/{id}', [OrderController::class, 'update']);
        Route::delete('/orders/{id}', [OrderController::class, 'destroy']);
        Route::post('/orders/{id}/update-status', [OrderController::class, 'updateStatus']);
        Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
        Route::post('/reports/sales', [App\Http\Controllers\API\ReportController::class, 'salesReport']);
        Route::post('/reports/containers', [App\Http\Controllers\API\ReportController::class, 'containersReport']);
        Route::post('/reports/inventory', [App\Http\Controllers\API\ReportController::class, 'inventoryReport']);
        Route::post('/reports/customers', [App\Http\Controllers\API\ReportController::class, 'customersReport']);
        
        // Exportar PDFs
        Route::post('/reports/sales/pdf', [App\Http\Controllers\API\ReportController::class, 'exportSalesPDF']);
        Route::post('/reports/containers/pdf', [App\Http\Controllers\API\ReportController::class, 'exportContainersPDF']);
        Route::post('/reports/inventory/pdf', [App\Http\Controllers\API\ReportController::class, 'exportInventoryPDF']);
        Route::post('/reports/customers/pdf', [App\Http\Controllers\API\ReportController::class, 'exportCustomersPDF']);
});
    
    // Rutas para usuarios - solo Admin
    Route::middleware('role:Admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });
    
    // Rutas para roles (para los formularios de usuarios)
    Route::get('/roles', [UserController::class, 'getRoles']);
    
    // Rutas para configuración del sistema - solo Admin
    Route::middleware('role:Admin')->group(function () {
        Route::get('/settings', [SettingController::class, 'index']);
        Route::put('/settings/{key}', [SettingController::class, 'update']);
        Route::post('/settings/bulk', [SettingController::class, 'updateBulk']);
        Route::post('/settings/test-email', [SettingController::class, 'testEmail']);
        Route::post('/settings/test-whatsapp', [SettingController::class, 'testWhatsApp']);
    });

    // Rutas para notificaciones - solo Admin
    Route::middleware(['auth:sanctum', 'role:Admin'])->group(function () {
    Route::get('/notifications', [App\Http\Controllers\API\NotificationController::class, 'index']);
    Route::get('/notifications/stats', [App\Http\Controllers\API\NotificationController::class, 'stats']);
    Route::get('/notifications/{id}', [App\Http\Controllers\API\NotificationController::class, 'show']);
    Route::post('/notifications/{id}/retry', [App\Http\Controllers\API\NotificationController::class, 'retry']);
    Route::post('/notifications/retry-all', [App\Http\Controllers\API\NotificationController::class, 'retryAll']);
});
});