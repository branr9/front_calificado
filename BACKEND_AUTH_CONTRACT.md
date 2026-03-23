# 🔐 CONTRATO DE AUTENTICACIÓN - BACKEND

## Endpoint de Login

**Ruta:** `POST http://localhost:8080/api/auth/login`

---

## 📨 REQUEST

El frontend envía JSON con credenciales:

```json
{
  "username": "admin",
  "password": "tu_clave_segura"
}
```

**Campos aceptados (flexible):**
- `username` - Obligatorio
- `password` - Obligatorio
- `identifier` / `user` / `login` - Alias para username (si el backend lo soporta)
- `email` - Alternativa a username (si el backend lo soporta)

---

## ✅ RESPONSE 200 (Login Exitoso)

El backend responde con uno de estos formatos (el frontend es flexible):

### Formato 1: Token en raíz con user object
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@tuapp.com",
    "nombreCompleto": "Administrador General",
    "rol": "ADMINISTRADOR",
    "permisos": ["READ_PROGRAMA", "EDIT_PROGRAMA", "DELETE_PROGRAMA"]
  }
}
```

### Formato 2: Token con variantes (accessToken, jwt)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "username": "funcionario1",
  "email": "funcionario1@tuapp.com",
  "nombreCompleto": "Funcionario Uno",
  "rol": "FUNCIONARIO",
  "permisos": ["READ_PROGRAMA", "READ_LINEAMIENTO"]
}
```

### Formato 3: Datos en objeto usuario (Español)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 2,
    "username": "docente1",
    "email": "docente1@tuapp.com",
    "nombreCompleto": "Docente Uno",
    "rol": "DOCENTE",
    "permisos": ["READ_PROGRAMA"]
  }
}
```

### Formato 4: Todos los datos en raíz (Mínimo)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": 3,
  "username": "usuario123",
  "email": "usuario@tuapp.com",
  "nombreCompleto": "Usuario Test",
  "rol": "FUNCIONARIO"
}
```

**Campos válidos en response:**
- `token` / `accessToken` / `jwt` - Token JWT para autorización
- `tokenType` - Tipo de token (ej: "Bearer")
- `permisos` - Array de permisos del usuario
- `user` / `usuario` - Objeto con datos del usuario
- `id`, `username`, `email`, `nombreCompleto`, `rol` - Pueden estar en raíz o dentro de user/usuario

---

## ❌ RESPONSE 401 (Credenciales inválidas)

```json
{
  "error": "Credenciales inválidas",
  "message": "Usuario o contraseña incorrectos"
}
```

O simplemente un status 401 sin body.

---

## ❌ RESPONSE 400 (Campos requeridos)

```json
{
  "error": "username y password son requeridos"
}
```

---

## 🔒 ENDPOINTS PROTEGIDOS

Para acceder a otros endpoints (`/api/programas`, `/api/lineamientos`, etc.):

**Header requerido:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Si el token no está presente o es inválido → **401 Unauthorized**

---

## 🌐 CORS

El backend debe permitir CORS desde el frontend:

```
Origin: http://localhost:4200
Métodos: GET, POST, PUT, PATCH, DELETE, OPTIONS
Headers: Authorization, Content-Type, Accept
```

---

## 🗄️ Base de Datos (MySQL - registrocalificado)

Tablas necesarias:

### Tabla: usuarios
```sql
CREATE TABLE usuarios (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(120),
  rol_id TINYINT UNSIGNED NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);
```

### Tabla: roles
```sql
CREATE TABLE roles (
  id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE,
  descripcion VARCHAR(255)
);
```

Datos iniciales:
```sql
INSERT INTO roles (nombre, descripcion) VALUES
('ADMINISTRADOR', 'Control total del sistema'),
('FUNCIONARIO', 'Acceso a dashboard y programas');
```

---

## 🔐 Seguridad - Validaciones Backend

1. ✅ Contraseña almacenada con hash (bcrypt, argon2, etc.) - **NUNCA en texto plano**
2. ✅ Validar usuario existe y está activo (activo = 1)
3. ✅ Comparar hash de contraseña con lo enviado
4. ✅ Generar token JWT válido
5. ✅ Incluir `rol` del usuario en la respuesta
6. ✅ Incluir `username` del usuario en la respuesta

---

## 📋 Test Rápido

1. **Iniciar backend** en `http://localhost:8080`
2. **Abrir frontend** en `http://localhost:4200/#/login`
3. **Ingresar credenciales:**
   - Usuario: `admin`
   - Contraseña: `admin123` (o la del admin en tu BD)
4. **Expected:** Redirige a dashboard, muestra datos del usuario logeado

---

## 🛠️ Stack Recomendado (según tu framework)

- **Spring Boot** → JWT (JWT library - io.jsonwebtoken)
- **Node.js/Express** → JWT (jsonwebtoken) + bcryptjs
- **PHP** → JWT (firebase/jwt) + password_hash()
- **Python/Django** → djangorestframework + JWT

---

## ❓ Preguntas Frecuentes

**P: ¿El token es obligatorio?**
R: No. Si el backend no maneja tokens, puede solo devolver el usuario y roles. El interceptor del frontend lo envía si existe.

**P: ¿Puedo usar otros roles además de ADMINISTRADOR y FUNCIONARIO?**
R: Sí, el frontend es flexible. Usa cualquier `rol` string. La única restricción es que `/usuarios` requiere `ADMINISTRADOR`.

**P: ¿Debo agregar más campos a la respuesta?**
R: No es necesario. El frontend usa: `id`, `username`, `email`, `nombreCompleto`, `rol`, `permisos`, `token`.

**P: ¿El password se envía encriptado desde el frontend?**
R: No, se envía en texto plano. Asegúrate de usar HTTPS en producción.

---

## ✅ Checklist de Entrega

- [ ] Endpoint `POST /api/auth/login` implementado
- [ ] Validación de credenciales contra BD registrocalificado
- [ ] Password almacenado con hash (no texto plano)
- [ ] Response JSON incluye: rol, username (y token si aplica)
- [ ] Response 401 cuando credenciales inválidas
- [ ] CORS habilitado para localhost:4200
- [ ] Endpoints `/api/programas`, `/api/lineamientos` etc. aceptan header Authorization
- [ ] Tests manual exitosos: login → dashboard → módulos

