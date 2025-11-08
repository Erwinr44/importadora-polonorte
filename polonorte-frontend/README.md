# Sistema de Inventarios y Seguimiento de Envíos - Frontend

Interfaz web del sistema de gestión de inventarios multi-bodega y seguimiento de envíos para Importadora Polonorte. Desarrollado como proyecto de trabajo de graduación para la Universidad Mariano Gálvez de Guatemala.

## Descripción del Proyecto

Aplicación web desarrollada con React y Next.js que proporciona una interfaz moderna y responsiva para la gestión integral de inventarios, seguimiento de pedidos y administración de operaciones de importación. El sistema implementa autenticación JWT y control de acceso basado en roles.

## Tecnologías Utilizadas

- **Framework:** Next.js 15.3.2
- **Biblioteca UI:** React 19
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS 4
- **Gestión de Estado:** React Hooks
- **HTTP Client:** Axios 1.9.0
- **Formularios:** React Hook Form 7.56.4
- **Gráficos:** Recharts 3.2.1
- **Iconos:** React Icons 5.5.0, Heroicons 2.2.0

## Requisitos del Sistema

### Software Requerido

- Node.js >= 18.x
- npm >= 9.x o yarn >= 1.22.x
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

### Servicios Requeridos

- Backend API del sistema (polonorte-backend) ejecutándose en http://localhost:8000

## Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/polonorte-frontend.git
cd polonorte-frontend
```

### 2. Instalar Dependencias
```bash
npm install
```

o si usas yarn:
```bash
yarn install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env.local
```

Editar el archivo `.env.local` con la URL del backend:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 4. Iniciar Servidor de Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 5. Compilar para Producción
```bash
npm run build
npm start
```

## Credenciales de Acceso

Para acceder al sistema utilizar las credenciales del backend:

- **Email:** admin@polonorte.com
- **Contraseña:** 123456

Ver el archivo `CREDENCIALES.md` del backend para más detalles.

## Estructura del Proyecto
```
polonorte-frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Página de inicio/login
│   │   ├── dashboard/               # Dashboard principal
│   │   ├── inventario/              # Gestión de inventario
│   │   ├── productos/               # Gestión de productos
│   │   ├── pedidos/                 # Gestión de pedidos
│   │   ├── furgones/                # Seguimiento de furgones
│   │   ├── usuarios/                # Administración de usuarios
│   │   ├── bodegas/                 # Gestión de bodegas
│   │   └── configuracion/           # Configuración del sistema
│   ├── components/
│   │   ├── common/                  # Componentes reutilizables
│   │   ├── layout/                  # Componentes de layout
│   │   └── forms/                   # Componentes de formularios
│   ├── services/
│   │   ├── api.ts                   # Configuración de Axios
│   │   ├── auth.service.ts          # Servicios de autenticación
│   │   ├── product.service.ts       # Servicios de productos
│   │   ├── inventory.service.ts     # Servicios de inventario
│   │   ├── order.service.ts         # Servicios de pedidos
│   │   └── container.service.ts     # Servicios de contenedores
│   ├── hooks/
│   │   ├── useAuth.ts               # Hook de autenticación
│   │   └── useLocalStorage.ts       # Hook de localStorage
│   ├── types/
│   │   └── index.ts                 # Definiciones de tipos TypeScript
│   └── utils/
│       └── helpers.ts               # Funciones auxiliares
├── public/
│   └── assets/                      # Imágenes y recursos estáticos
├── .env.example                     # Plantilla de variables de entorno
├── next.config.js                   # Configuración de Next.js
├── tailwind.config.ts               # Configuración de Tailwind
├── tsconfig.json                    # Configuración de TypeScript
└── package.json                     # Dependencias del proyecto
```

## Funcionalidades Principales

### Módulo de Autenticación
- Inicio de sesión con JWT
- Cierre de sesión
- Verificación de sesión activa
- Redirección automática según rol

### Dashboard
- Estadísticas generales del sistema
- Productos con stock bajo
- Resumen de pedidos recientes
- Gráficos de inventario

### Gestión de Inventario
- Visualización de stock por bodega
- Transferencias entre bodegas
- Actualización de cantidades
- Alertas de stock mínimo

### Gestión de Productos
- Listado de productos
- Creación de nuevos productos
- Edición de productos existentes
- Eliminación de productos
- Categorización y búsqueda

### Gestión de Pedidos
- Creación de pedidos
- Listado y filtrado de pedidos
- Actualización de estado
- Seguimiento por código
- Cancelación de pedidos

### Seguimiento de Furgones
- Registro de contenedores
- Actualización de estado
- Historial de tracking
- Consulta pública por código

### Administración de Usuarios
- Gestión de usuarios del sistema
- Asignación de roles
- Activación/desactivación
- Gestión de permisos

## Roles y Permisos

### Admin
- Acceso completo al sistema
- Gestión de usuarios
- Configuración del sistema
- Acceso a todos los módulos

### Operador
- Gestión de inventario
- Gestión de productos
- Gestión de pedidos
- Seguimiento de furgones

### Proveedor
- Actualización de estado de furgones asignados
- Consulta de contenedores propios

### Cliente
- Consulta de estado de pedidos mediante código de seguimiento
- Sin acceso al sistema interno

## Seguridad

### Autenticación
- JWT tokens almacenados en localStorage
- Verificación automática de sesión
- Expiración de tokens
- Cierre de sesión automático

### Autorización
- Rutas protegidas por rol
- Verificación de permisos en cada componente
- Redirección automática si no hay acceso

### Validación
- Validación de formularios con React Hook Form
- Mensajes de error descriptivos
- Sanitización de entradas

## Scripts Disponibles
```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Compila para producción
npm start            # Inicia servidor de producción

# Calidad de código
npm run lint         # Ejecuta ESLint
```

## Configuración de Entornos

### Desarrollo
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Producción
```env
NEXT_PUBLIC_API_URL=https://api.polonorte.com/api
```

## Deployment

### Vercel (Recomendado)

1. Conectar el repositorio con Vercel
2. Configurar las variables de entorno
3. Deploy automático en cada push

### Otros Servicios

El proyecto puede desplegarse en cualquier servicio que soporte Next.js:
- Netlify
- AWS Amplify
- Digital Ocean
- Heroku

## Características Técnicas

### Optimizaciones
- Server-side rendering (SSR) con Next.js
- Lazy loading de componentes
- Optimización de imágenes automática
- Code splitting automático

### Responsive Design
- Diseño adaptable a todos los dispositivos
- Mobile-first approach
- Breakpoints de Tailwind CSS

### Accesibilidad
- Navegación por teclado
- Etiquetas ARIA apropiadas
- Contraste de colores adecuado

## Solución de Problemas

### Error: Cannot connect to backend
Verificar que el backend esté ejecutándose en http://localhost:8000

### Error: JWT Token Invalid
Cerrar sesión y volver a iniciar sesión

### Error: CORS Policy
Verificar configuración de CORS en el backend

## Documentación Adicional

Para documentación técnica completa, consultar:
- Manual de Usuario (incluido en el proyecto de tesis)
- Manual Técnico (incluido en el proyecto de tesis)

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