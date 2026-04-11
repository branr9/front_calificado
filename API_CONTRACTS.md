# 🔌 CONTRATOS DE API - MÓDULO DE USUARIOS

**Frontend espera estos endpoints del backend:**

---

## 📍 BASE URL
```
http://localhost:8080/api
```

---

## 👥 USUARIOS ENDPOINTS

### 1. Listar todos los usuarios
```http
GET /api/usuarios
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "nombreCompleto": "Administrador",
    "rol": "ADMINISTRADOR",
    "activo": true
  },
  {
    "id": 2,
    "username": "user1",
    "email": "user1@example.com",
    "nombreCompleto": "Usuario Uno",
    "rol": "FUNCIONARIO",
    "activo": true
  }
]
```

---

### 2. Obtener un usuario por ID
```http
GET /api/usuarios/{id}
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "nombreCompleto": "Administrador",
  "rol": "ADMINISTRADOR",
  "activo": true
}
```

---

### 3. Crear nuevo usuario ⚠️ ESTÁ FALLANDO AQUÍ
```http
POST /api/usuarios
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "branr9",
  "email": "branr9quintero@gmail.com",
  "password": "admin123",
  "nombreCompleto": "brandon david quintero",
  "rol": "ADMINISTRADOR"
}
```

**Response 201 CREATED (esperado):**
```json
{
  "id": 3,
  "username": "branr9",
  "email": "branr9quintero@gmail.com",
  "nombreCompleto": "brandon david quintero",
  "rol": "ADMINISTRADOR",
  "activo": true
}
```

**Response 500 ERROR (lo que recibimos):**
```json
{
  "error": "Transaction silently rolled back because it has been marked as rollback-only"
}
```

---

### 4. Actualizar usuario
```http
PUT /api/usuarios/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (solo campos editables):**
```json
{
  "email": "newemail@example.com",
  "nombreCompleto": "Nuevo Nombre",
  "rol": "FUNCIONARIO",
  "activo": true
}
```

**Response 200 OK:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "newemail@example.com",
  "nombreCompleto": "Nuevo Nombre",
  "rol": "FUNCIONARIO",
  "activo": true
}
```

---

### 5. Eliminar usuario
```http
DELETE /api/usuarios/{id}
Authorization: Bearer {token}
```

**Response 204 NO CONTENT** (sin body)

---

### 6. Cambiar contraseña
```http
POST /api/usuarios/{id}/change-password
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "oldPassword": "admin123",
  "newPassword": "newPass456"
}
```

**Response 200 OK:**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

## 🔑 Campos del Usuario

| Campo | Tipo | Origen | Editable | Requerido |
|-------|------|--------|----------|-----------|
| `id` | number | Backend | ❌ | Auto |
| `username` | string | Frontend | ❌ | ✅ |
| `email` | string | Frontend | ✅ | ✅ |
| `password` | string | Frontend | ❌ (solo creación) | ✅ (creación) |
| `nombreCompleto` | string | Frontend | ✅ | ✅ |
| `rol` | string enum | Frontend | ✅ | ✅ |
| `activo` | boolean | Frontend | ✅ | ❌ (default: true) |

---

## 🎯 Valores Válidos

### Rol
```
ADMINISTRADOR
FUNCIONARIO  
DOCENTE
USUARIO
DOCENTE_TEST
ESTUDIANTE
ADMIN
```

(Nota: Los roles existen en BD, aunque hay duplicados)

---

## 🔐 Autenticación

Todos los endpoints (excepto `/api/auth/login`) requieren:
```
Header: Authorization: Bearer {JWT_TOKEN}
```

Si el token falta o es inválido:
```
Response 401 Unauthorized
```

---

## ⚠️ ERRORES POSIBLES

| Status | Causa | Solution |
|--------|-------|----------|
| **400** | Validación fallida (campo vacío, email inválido) | Revisar Request body |
| **401** | Token inválido o expirado | Volver a login |
| **404** | Usuario no encontrado | ID no existe |
| **409** | Username/Email duplicado | Usar otro username |
| **500** | Error interno del servidor | VER LOGS DEL BACKEND |

---

## 🐛 El Error Actual: 500

```
{
  "error": "Transaction silently rolled back because it has been marked as rollback-only"
}
```

**Esto ocurre cuando:**
1. ❌ Rol no existe en tabla `roles`
2. ❌ Email o Username ya existen (UNIQUE constraint)
3. ❌ Validación fallida silenciosamente
4. ❌ Campo requerido es NULL
5. ❌ Excepción en la lógica del negocio

**Para debuggear:** Necesitamos el stack trace del backend

---

## 📝 Resumen para Backend

**El frontend está OK.** El problema es en el backend:

1. ✅ Envía datos correctos
2. ✅ Usa Bearer token
3. ✅ Formato de request es correcto
4. 🔴 Backend rechaza con 500

**Revisar:**
- Logs del backend cuando se intenta POST a `/api/usuarios`
- DTO CreateUsuarioDTO
- Validaciones del entity Usuario
- Búsqueda/mapeo del rol

