# Backend API

Backend REST API con autenticación JWT y autorización basada en roles, construido con Node.js, Express, TypeScript y PostgreSQL.

## 🚀 Características

- Arquitectura modular con separación de concerns
- Autenticación JWT con Access Token y Refresh Token
- Sistema de roles (USER, ADMIN)
- Validación de datos con Zod
- Middleware de autenticación y autorización
- Manejo centralizado de errores
- ORM TypeORM con PostgreSQL
- Gestión de cookies HTTP-only para tokens
- API RESTful estructurada
- TypeScript para type safety

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

## 🔧 Instalación

1. Clonar el repositorio y navegar al directorio backend:

```bash
cd backend
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar variables de entorno:

```bash
cp .env.example .env
```

Editar el archivo `.env` con tus configuraciones:

```env
# Server Configuration
PORT=3009
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=proyect1

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

## 🗄️ Configuración de Base de Datos

Asegúrate de que PostgreSQL esté corriendo y crea la base de datos:

```sql
CREATE DATABASE proyect1;
```

La aplicación sincronizará automáticamente las tablas al iniciar (modo `synchronize: true` en `src/config/database.ts`).

## 🏃 Scripts Disponibles

```bash
npm run dev    # Inicia el servidor en modo desarrollo con hot-reload
npm test       # Ejecuta tests (por configurar)
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── modules/             # Módulos de funcionalidad (features)
│   │   └── auth/            # Módulo de autenticación
│   │       ├── auth.controller.ts   # Controlador de autenticación
│   │       ├── auth.dto.ts          # DTOs y schemas de validación (Zod)
│   │       ├── auth.repository.ts   # Repositorio de datos
│   │       ├── auth.routes.ts       # Rutas de autenticación
│   │       ├── auth.service.ts      # Lógica de negocio
│   │       ├── auth.types.ts        # Tipos TypeScript
│   │       └── protected.ts         # Rutas protegidas de ejemplo
│   ├── shared/             # Código compartido entre módulos
│   │   ├── config/
│   │   │   └── database.ts          # Configuración de TypeORM
│   │   ├── entities/
│   │   │   ├── User.ts              # Entidad User con roles
│   │   │   └── RefreshToken.ts      # Entidad RefreshToken
│   │   └── middlewares/
│   │       ├── auth.ts              # Middleware de autenticación y autorización
│   │       ├── errorHandler.ts      # Manejo centralizado de errores
│   │       └── validation.ts        # Middleware de validación con Zod
│   ├── app.ts               # Configuración de Express
│   └── server.ts            # Punto de entrada
├── .env                     # Variables de entorno (no versionar)
├── .env.example             # Template de variables de entorno
├── .gitignore               # Archivos ignorados por Git
├── package.json             # Dependencias y scripts
├── tsconfig.json            # Configuración de TypeScript
└── README.md                # Este archivo
```

## 🔌 API Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/refresh` | Renovar access token |
| POST | `/api/auth/logout` | Cerrar sesión (token actual) |
| POST | `/api/auth/logout-all` | Cerrar todas las sesiones |

### Rutas Protegidas (`/api/protected`)

| Método | Endpoint | Descripción | Requisitos |
|--------|----------|-------------|------------|
| GET | `/api/protected/public` | Ruta pública | Ninguno |
| GET | `/api/protected/authenticated` | Ruta autenticada | Login requerido |
| GET | `/api/protected/admin` | Ruta admin | Rol ADMIN |
| GET | `/api/protected/user-or-admin` | Ruta para USER o ADMIN | Rol USER o ADMIN |

### Health Check

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Verificar estado del servidor |

## 🔐 Autenticación

La API utiliza cookies HTTP-only para almacenar los tokens:

- **Access Token**: Token de corta duración para autenticación
- **Refresh Token**: Token de larga duración para renovar el access token

### Ejemplo de Login

```bash
curl -X POST http://localhost:3009/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt
```

### Ejemplo de Ruta Protegida

```bash
curl -X GET http://localhost:3009/api/protected/authenticated \
  -b cookies.txt
```

## 👥 Roles de Usuario

- **USER**: Rol por defecto para usuarios registrados
- **ADMIN**: Rol con permisos administrativos

## 🛡️ Middleware

El proyecto incluye varios middleware para proteger y validar rutas:

### Autenticación y Autorización

```typescript
// Requiere autenticación
authMiddleware

// Requiere rol específico
requireRole(UserRole.ADMIN)

// Requiere rol de administrador (helper)
requireAdmin
```

### Validación

Los endpoints utilizan validación con Zod para asegurar la integridad de los datos:

```typescript
// Validar cuerpo de la solicitud
validateBody(RegisterDtoSchema)

// Validar cookies
validateCookie(CookieRefreshTokenDtoSchema)
```

### Manejo de Errores

El proyecto tiene manejo centralizado de errores con `errorHandler` y `notFoundHandler`:

- **errorHandler**: Captura y formatea errores de manera consistente
- **notFoundHandler**: Maneja rutas no encontradas
- **AppError**: Clase personalizada para errores de aplicación

## 🧪 Testing

Los tests aún no están implementados. Se recomienda agregar:
- Unit tests para servicios
- Integration tests para endpoints
- Tests para middleware de autenticación

## 📝 Notas de Desarrollo

- La base de datos se sincroniza automáticamente en modo desarrollo (`synchronize: true`)
- Los tokens se almacenan en cookies HTTP-only por seguridad
- Las contraseñas se hashean usando bcrypt
- TypeORM maneja las migraciones automáticamente en desarrollo
- Arquitectura modular: cada feature es un módulo en `modules/`
- Código compartido en `shared/` (config, entities, middlewares)
- Validación de datos con Zod schemas en cada módulo
- Manejo centralizado de errores con middleware `errorHandler`
- Los DTOs definen la estructura de entrada/salida de datos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

ISC
