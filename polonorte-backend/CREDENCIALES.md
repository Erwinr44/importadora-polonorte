# Credenciales de Acceso al Sistema

Este documento contiene las credenciales del usuario administrador para acceder al sistema de gestión de inventarios y seguimiento de envíos de Importadora Polonorte.

## Usuario Administrador

- **Email:** admin@polonorte.com
- **Contraseña:** 123456
- **Rol:** Admin
- **Permisos:** Acceso completo al sistema

## Funcionalidades del Rol Admin

El usuario administrador tiene acceso a todas las funcionalidades del sistema:

- Gestión completa de usuarios (crear, editar, eliminar)
- Gestión de productos y catálogo
- Administración de bodegas
- Control total del inventario
- Gestión de pedidos de clientes
- Seguimiento de contenedores/furgones
- Administración de proveedores
- Acceso a reportes y estadísticas
- Configuración del sistema
- Gestión de notificaciones

## Instrucciones de Uso

### Primer Acceso

1. Iniciar el servidor backend:
```bash
   php artisan serve
```

2. Acceder a la aplicación frontend en el navegador

3. Utilizar las credenciales proporcionadas arriba para iniciar sesión

4. Una vez dentro del sistema, se recomienda:
   - Cambiar la contraseña del administrador
   - Crear usuarios adicionales según los roles necesarios
   - Configurar las credenciales de Twilio y SendGrid para notificaciones

### Creación de Usuarios Adicionales

Desde el panel de administración, el usuario Admin puede crear nuevos usuarios con los siguientes roles:

- **Admin:** Control total del sistema
- **Operador:** Gestión de inventario, productos, pedidos y contenedores
- **Proveedor:** Actualización de estado de contenedores asignados
- **Cliente:** Solo consulta de pedidos mediante código de seguimiento (no requiere registro)

## Seguridad

### Recomendaciones

- Cambiar la contraseña predeterminada después del primer acceso
- Utilizar contraseñas seguras con al menos 8 caracteres
- No compartir las credenciales de administrador
- Crear usuarios específicos para cada persona que necesite acceso
- Revisar periódicamente los usuarios activos en el sistema

### Recuperación de Contraseña

Si olvida la contraseña del administrador, puede restablecerla ejecutando:
```bash
php artisan tinker
```

Luego dentro de tinker:
```php
$user = \App\Models\User::where('email', 'admin@polonorte.com')->first();
$user->password = \Illuminate\Support\Facades\Hash::make('nueva_contraseña');
$user->save();
exit
```

## Notas Importantes

- Este usuario es creado automáticamente al ejecutar `php artisan db:seed`
- Las credenciales son únicamente para propósitos de demostración y evaluación
- En un entorno de producción, estas credenciales deben ser modificadas inmediatamente
- El sistema registra todas las acciones realizadas por cada usuario para auditoría

## Soporte

Para consultas sobre el acceso al sistema o problemas técnicos:

- Email: erwinroldan44@gmail.com
- Documentación: Consultar Manual de Usuario y Manual Técnico incluidos en el proyecto