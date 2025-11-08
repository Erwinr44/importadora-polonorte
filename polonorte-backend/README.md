# Sistema de Inventarios y Seguimiento de Envíos - Backend API

Sistema web para la gestión de inventarios multi-bodega y seguimiento de envíos para Importadora Polonorte. Desarrollado como proyecto de trabajo de graduación para la Universidad Mariano Gálvez de Guatemala.

## Descripción del Proyecto

API RESTful desarrollada con Laravel que proporciona servicios backend para la gestión integral de inventarios, seguimiento de furgones importados, administración de pedidos y notificaciones automatizadas. El sistema implementa autenticación basada en JWT y control de acceso mediante roles diferenciados.

## Tecnologías Utilizadas

- **Framework:** Laravel 12
- **Lenguaje:** PHP 8.2
- **Base de Datos:** SQLite 3.39.2
- **Autenticación:** Laravel Sanctum (JWT)
- **Arquitectura:** API RESTful
- **Patrón de Diseño:** MVC (Modelo-Vista-Controlador)

## Requisitos del Sistema

### Software Requerido

- PHP >= 8.2
- Composer >= 2.0
- SQLite >= 3.0 (incluido con PHP)
- Extensiones PHP:
  - OpenSSL
  - PDO
  - Mbstring
  - Tokenizer
  - XML
  - Ctype
  - JSON
  - BCMath
  - SQLite3

### Servicios Externos

- Cuenta de Twilio (para notificaciones WhatsApp)
- Cuenta de SendGrid (para notificaciones por correo electrónico)

## Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/polonorte-backend.git
cd polonorte-backend
```

### 2. Instalar Dependencias
```bash
composer install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env
```

Editar el archivo `.env` con las credenciales correspondientes. La configuración de base de datos ya está lista para SQLite.

### 4. Generar Clave de Aplicación
```bash
php artisan key:generate
```

### 5. Crear Base de Datos y Ejecutar Migraciones
```bash
# Crear el archivo de base de datos SQLite
touch database/database.sqlite

# Ejecutar migraciones
php artisan migrate
```

### 6. Poblar Base de Datos
```bash
php artisan db:seed
```

Esto creará los roles y un usuario administrador de prueba.

### 7. Iniciar Servidor de Desarrollo
```bash
php artisan serve
```

La API estará disponible en `http://localhost:8000`

## Credenciales de Acceso

Para acceder al sistema después de la instalación:

- **Email:** admin@polonorte.com
- **Contraseña:** 123456
- **Rol:** Admin

Ver archivo `CREDENCIALES.md` para más detalles.

## Estructura del Proyecto
```
polonorte-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── API/
│   │   │       ├── AuthController.php
│   │   │       ├── ProductController.php
│   │   │       ├── InventoryController.php
│   │   │       ├── OrderController.php
│   │   │       ├── ContainerController.php
│   │   │       ├── UserController.php
│   │   │       ├── WarehouseController.php
│   │   │       ├── SupplierController.php
│   │   │       ├── DashboardController.php
│   │   │       └── ReportController.php
│   │   └── Middleware/
│   │       └── CheckRole.php
│   └── Models/
│       ├── User.php
│       ├── Product.php
│       ├── Inventory.php
│       ├── Order.php
│       ├── Container.php
│       ├── Warehouse.php
│       └── Supplier.php
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── database.sqlite
├── routes/
│   └── api.php
└── config/
```

## Endpoints Principales

### Autenticación

**POST** `/api/login`
- Descripción: Iniciar sesión y obtener token JWT
- Body: `{ "email": "usuario@ejemplo.com", "password": "password" }`

**POST** `/api/logout`
- Descripción: Cerrar sesión e invalidar token
- Headers: `Authorization: Bearer {token}`

**GET** `/api/user`
- Descripción: Obtener información del usuario autenticado
- Headers: `Authorization: Bearer {token}`

### Productos

**GET** `/api/products`
- Descripción: Listar todos los productos
- Roles: Admin, Operador

**POST** `/api/products`
- Descripción: Crear nuevo producto
- Roles: Admin, Operador

**PUT** `/api/products/{id}`
- Descripción: Actualizar producto existente
- Roles: Admin, Operador

**DELETE** `/api/products/{id}`
- Descripción: Eliminar producto
- Roles: Admin, Operador

### Inventario

**GET** `/api/inventory`
- Descripción: Obtener inventario de todas las bodegas
- Roles: Admin, Operador

**POST** `/api/inventory/update-quantity`
- Descripción: Actualizar cantidad de stock
- Roles: Admin, Operador

**POST** `/api/inventory/transfer`
- Descripción: Transferir stock entre bodegas
- Roles: Admin, Operador

### Pedidos

**GET** `/api/orders`
- Descripción: Listar todos los pedidos
- Roles: Admin, Operador

**POST** `/api/orders`
- Descripción: Crear nuevo pedido
- Roles: Admin, Operador

**GET** `/api/orders/track/{trackingCode}`
- Descripción: Consultar estado de pedido por código de seguimiento
- Acceso: Público

**POST** `/api/orders/{id}/update-status`
- Descripción: Actualizar estado del pedido
- Roles: Admin, Operador

**POST** `/api/orders/{id}/cancel`
- Descripción: Cancelar pedido y restaurar inventario
- Roles: Admin, Operador

### Furgones/Contenedores

**GET** `/api/containers`
- Descripción: Listar todos los contenedores
- Roles: Todos los autenticados

**POST** `/api/containers`
- Descripción: Registrar nuevo contenedor
- Roles: Todos los autenticados

**GET** `/api/containers/track/{trackingCode}`
- Descripción: Consultar estado de contenedor por código
- Acceso: Público

**POST** `/api/containers/{id}/update-status`
- Descripción: Actualizar estado del contenedor
- Roles: Todos los autenticados

### Dashboard

**GET** `/api/dashboard/stats`
- Descripción: Obtener estadísticas generales del sistema
- Roles: Admin, Operador

**GET** `/api/dashboard/low-stock`
- Descripción: Obtener productos con stock bajo
- Roles: Admin, Operador

### Usuarios

**GET** `/api/users`
- Descripción: Listar todos los usuarios
- Roles: Admin

**POST** `/api/users`
- Descripción: Crear nuevo usuario
- Roles: Admin

**PUT** `/api/users/{id}`
- Descripción: Actualizar usuario
- Roles: Admin

**DELETE** `/api/users/{id}`
- Descripción: Eliminar usuario
- Roles: Admin

## Roles del Sistema

El sistema implementa cuatro roles con permisos diferenciados:

- **Admin:** Acceso completo al sistema, gestión de usuarios y configuración
- **Operador:** Gestión de inventario, productos, pedidos y furgones
- **Proveedor:** Actualización de estado de furgones asignados
- **Cliente:** Consulta de estado de pedidos (acceso público mediante código)

## Middleware Implementado

### CheckRole
Middleware personalizado para verificar que el usuario autenticado tenga los roles necesarios para acceder a rutas protegidas.

Uso:
```php
Route::middleware('role:Admin,Operador')->group(function () {
    // Rutas protegidas
});
```

## Base de Datos

### Motor de Base de Datos

El proyecto utiliza SQLite como motor de base de datos, almacenado en el archivo `database/database.sqlite`. SQLite fue seleccionado por:

- Portabilidad y facilidad de distribución
- No requiere servidor de base de datos separado
- Ideal para desarrollo y demostración
- Incluido por defecto en PHP

### Tablas Principales

- **users:** Usuarios del sistema con roles
- **roles:** Roles y permisos del sistema
- **products:** Catálogo de productos
- **warehouses:** Bodegas de almacenamiento
- **inventory:** Stock de productos por bodega
- **containers:** Furgones/contenedores importados
- **orders:** Pedidos de clientes
- **order_product:** Relación muchos a muchos entre pedidos y productos
- **suppliers:** Proveedores de mercancía
- **notifications:** Registro de notificaciones enviadas
- **order_tracking:** Historial de cambios de estado de pedidos
- **container_tracking:** Historial de cambios de estado de contenedores

### Diagrama Entidad-Relación

El diagrama completo de la base de datos se encuentra en la documentación del proyecto.

### Exportar/Importar Base de Datos
```bash
# Crear respaldo
cp database/database.sqlite database/backup_$(date +%Y%m%d).sqlite

# Restaurar desde respaldo
cp database/backup.sqlite database/database.sqlite
```

## Notificaciones

El sistema implementa notificaciones automáticas mediante:

- **WhatsApp:** Integración con Twilio para mensajes instantáneos
- **Correo Electrónico:** Integración con SendGrid para notificaciones detalladas

Eventos que generan notificaciones:
- Creación de nuevo pedido
- Cambio de estado de pedido
- Llegada de furgón
- Alerta de stock bajo

## Seguridad

- Autenticación mediante JWT tokens con Laravel Sanctum
- Validación de datos en todas las peticiones
- Control de acceso basado en roles
- Rate limiting para prevenir abuso de endpoints
- Protección CSRF en formularios
- Sanitización de entradas de usuario

## Pruebas

Para ejecutar las pruebas unitarias:
```bash
php artisan test
```

## Deployment

### Consideraciones para Producción

1. Configurar variable `APP_ENV=production` en `.env`
2. Cambiar `APP_DEBUG=false` en producción
3. Ejecutar optimizaciones:
```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
```
4. Configurar certificado SSL/HTTPS
5. Configurar CORS adecuadamente
6. Implementar sistema de respaldos de base de datos
7. Configurar logs y monitoreo

### Migración a MySQL/PostgreSQL

Si se requiere migrar a un motor de base de datos más robusto:

1. Modificar `.env`:
```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=polonorte
   DB_USERNAME=root
   DB_PASSWORD=
```

2. Ejecutar migraciones:
```bash
   php artisan migrate:fresh --seed
```

## Mantenimiento

### Respaldos
```bash
# Respaldar base de datos SQLite
cp database/database.sqlite backups/backup_$(date +%Y%m%d).sqlite
```

### Logs

Los logs del sistema se almacenan en `storage/logs/laravel.log`

Para limpiar logs antiguos:
```bash
php artisan log:clear
```

### Actualización de Dependencias
```bash
composer update
```

## Documentación Adicional

Para documentación técnica completa, consultar el Manual Técnico incluido en el proyecto de tesis.

## Autor

**Erwin Adolfo Roldán Hernández**

Universidad Mariano Gálvez de Guatemala  
Facultad de Ingeniería en Sistemas de Información  
Trabajo de Graduación - Noviembre 2025

## Contacto

Para consultas técnicas o soporte:
- Email: erwinroldan44@gmail.com

## Licencia

Proyecto académico desarrollado para la Universidad Mariano Gálvez de Guatemala.
Todos los derechos reservados.

## Agradecimientos

- Importadora Polonorte por facilitar el caso de estudio
- Universidad Mariano Gálvez de Guatemala
- Asesores del proyecto de tesis