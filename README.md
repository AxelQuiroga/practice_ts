# Backend API

Backend REST API con autenticación JWT, sistema de soporte multi-ticket en tiempo real y autorización basada en roles. Construido con Node.js, Express, TypeScript, Socket.io y PostgreSQL.

## 🚀 Características

- **Arquitectura modular** con separación de concerns (Controller, Service, Repository)
- **Sistema de Soporte Multi-Ticket**:
    - Gestión de hasta 5 tickets simultáneos por usuario.
    - Ciclo de vida automático: `OPEN`, `IN_PROGRESS`, `RESOLVED`.
    - Transición automática a `IN_PROGRESS` cuando un Admin responde.
- **Comunicación en Tiempo Real (Socket.io)**:
    - Aislamiento por salas (`rooms`) específicas para cada ticket.
    - Notificaciones instantáneas para usuarios y administradores.
- **Autenticación Robusta**: JWT con Access Token y Refresh Token (HTTP-only cookies).
- **Seguridad**: Sistema de roles (USER, ADMIN) y validación de esquemas con Zod.
- **Persistencia**: ORM TypeORM con PostgreSQL.

## 📁 Estructura del Proyecto (Módulos Core)

```
backend/
├── src/
│   ├── modules/
│   │   └── auth/
│   │       ├── chat/               # Lógica de Chat y Soporte
│   │       │   └── chat.service.ts # Orquestación de tickets y mensajes
│   │       ├── entities/
│   │       │   ├── User.ts         # Usuario y Roles
│   │       │   ├── Ticket.ts       # Entidad Soporte (OPEN/IN_PROGRESS/RESOLVED)
│   │       │   └── ChatMessage.ts  # Mensajes vinculados a tickets
│   │       ├── chat.repository.ts  # Persistencia de mensajes
│   │       └── ticket.repository.ts # Gestión de estados y límites
│   ├── shared/
│   │   └── infrastructure/
│   │       └── socket/
│   │           ├── socket.manager.ts # Gateway de Socket.io y Handlers
│   │           └── chat-tester.html  # Herramienta de Debug/Verification
├── scratch/
│   └── verify_tickets.ts           # Script de verificación de lógica de negocio
```

## 🔌 Sistema de Soporte (Socket.io Events)

El sistema de soporte opera principalmente a través de WebSockets para garantizar inmediatez.

### Eventos del Usuario
| Evento | Payload | Descripción |
|--------|---------|-------------|
| `support:message` | `{ text, subject?, ticketId? }` | Envía un mensaje. Si no hay `ticketId`, crea uno nuevo con el `subject`. |

### Eventos del Administrador
| Evento | Payload | Descripción |
|--------|---------|-------------|
| `support:response` | `{ ticketId, response }` | Envía una respuesta. Cambia el estado del ticket a `IN_PROGRESS`. |
| `support:resolve_ticket` | `{ ticketId }` | Marca el ticket como `RESOLVED`. |

### Notificaciones de Salida
| Evento | Payload | Destinatario |
|--------|---------|--------------|
| `support:new_message` | `ChatMessage & { ticketId }` | Room del ticket |
| `support:ticket_created` | `Ticket` | Admins |
| `support:ticket_resolved` | `{ ticketId }` | Room del ticket |

## 🧪 Verificación y Pruebas

Para asegurar la integridad del sistema, disponemos de dos métodos de prueba:

### 1. Verificación Automática (Business Logic)
Ejecutá el script de validación que testea límites de tickets y transiciones de estado:
```bash
npx ts-node scratch/verify_tickets.ts
```

### 2. Verificación Manual (Flow E2E)
Utilizá el debugger premium incluido en:
`src/shared/infrastructure/socket/chat-tester.html`

Esta herramienta permite:
- Simular login de Usuario o Admin.
- Ver la lista de tickets activos.
- Chatear en salas aisladas.
- Verificar el cambio de estados en tiempo real.

## 🏃 Instalación y Ejecución

1. `npm install`
2. Configurar `.env` (ver `.env.example`)
3. `npm run dev`

---
**Nota**: El sistema impone un límite estricto de **5 tickets activos** por usuario para prevenir spam y saturación de soporte.
Os definen la estructura de entrada/salida de datos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

ISC
