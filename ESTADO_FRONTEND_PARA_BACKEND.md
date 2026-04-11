# 📊 ESTADO DEL FRONTEND - MÓDULO DE USUARIOS

**Fecha:** 5 de Abril 2026  
**Proyecto:** front_calificado  
**Componente:** Gestión de Usuarios  

---

## ✅ LO QUE FUNCIONA

### Infraestructura
- ✅ Frontend corriendo en `http://localhost:4200`
- ✅ Angular 21 configurado
- ✅ Proxy configurado en `proxy.conf.json` apuntando a `http://localhost:8080`
- ✅ AuthInterceptor agrega token Bearer correctamente
- ✅ Formularios reactivos implementados

### Funcionalidad
- ✅ **Listar usuarios**: Tabla muestra usuarios cuando cargan correctamente
- ✅ **Validaciones de formulario**: Email, password, campos requeridos validados
- ✅ **Interfaces TS**: DTOs definidas correctamente:
  - `UsuarioDTO` (lectura)
  - `CreateUsuarioDTO` (creación)
  - `UpdateUsuarioDTO` (edición)

---

## 🔴 LO QUE NO FUNCIONA

### Error Principal
**Crear nuevo usuario → HTTP 500 Internal Server Error**

```
POST http://localhost:4200/api/usuarios
Response: 500 Internal Server Error
```

**Mensaje de error del servidor:**
```json
{
  "error": "Transaction silently rolled back because it has been marked as rollback-only"
}
```

### Datos Enviados (CORRECTOS)
```json
{
  "username": "branr9",
  "email": "branr9quintero@gmail.com",
  "password": "admin123",
  "nombreCompleto": "brandon david quintero",
  "rol": "ADMINISTRADOR"
}
```

### Segunda Funcionalidad Afectada
**Listar usuarios → Falla silenciosamente** (probablemente mismo error que crear)

---

## 🔍 DIAGNÓSTICO

### Verificado en BD (MySQL - registrocalificado)
```
Tabla: roles
┌────┬───────────────┬─────────────────────────────┐
│ id │ nombre        │ descripcion                 │
├────┼───────────────┼─────────────────────────────┤
│ 5  │ ADMIN         │ Administrador del siste...  │
│ 6  │ DOCENTE_TEST  │ Docente de programa         │
│ 7  │ ESTUDIANTE    │ Estudiante del programa     │
│ 1  │ ADMINISTRADOR │ Administrador del siste...  │
│ 2  │ FUNCIONARIO   │ Funcionario del programa    │
│ 3  │ DOCENTE       │ Docente del programa        │
└────┴───────────────┴─────────────────────────────┘
```

✅ Los roles EXISTEN (aunque hay duplicados)

### Información de la Tabla `usuarios`
**NECESITAMOS:** Output del comando:
```sql
DESCRIBE usuarios;
SHOW CREATE TABLE usuarios\G
```

---

## 📋 INFORMACIÓN QUE NECESITAMOS DEL BACKEND

Para debuggear el error, necesitamos:

### 1. **Logs del Backend (CRÍTICO)**
Cuando intentas crear usuario desde el frontend, ¿qué error muestra el backend?

Típicamente en Spring Boot:
```
ERROR - javax.persistence.RollbackException
Caused by: javax.validation.ConstraintViolationException
  o: org.hibernate.exception.ConstraintViolationException
  o: java.lang.NullPointerException
```

**Copia el STACK TRACE COMPLETO**

### 2. **DTO CreateUsuarioDTO (Backend)**
¿Cuál es la estructura exacta que espera?

Ejemplo esperado:
```java
public class CreateUsuarioDTO {
    private String username;      // ✅ Frontend envía
    private String email;         // ✅ Frontend envía
    private String password;      // ✅ Frontend envía
    private String nombreCompleto;  // ✅ Frontend envía
    private String rol;           // ✅ Frontend envía (string: "ADMINISTRADOR")
    // ¿Falta algo más?
}
```

### 3. **Mapeo de Rol**
¿Cómo convierte el backend `rol: "ADMINISTRADOR"` (string) a `rolId` (integer)?

¿Ejecuta algo como:
```java
Rol rolEntity = rolRepository.findByNombre(createDTO.rol);
if (rolEntity == null) {
    throw new Exception("Rol not found");
}
usuario.setRol(rolEntity);
```

### 4. **Validaciones del Entity Usuario**
¿Tiene validaciones con `@NotNull`, `@NotBlank`, etc.?

```java
@Entity
public class Usuario {
    @Id
    private Long id;
    
    @NotBlank(message = "Username es requerido")
    @Column(unique = true)
    private String username;
    
    // ... más campos
}
```

### 5. **Tabla `usuarios` - Estructura actual**
```sql
DESCRIBE usuarios;
```

---

## 🔧 PRÓXIMOS PASOS PARA EL BACKEND

1. **Capturar y compartir el error completo** que genera el backend
2. **Revisar el DTO CreateUsuarioDTO** del backend
3. **Debuggear si el rol se busca correctamente** en la tabla `roles`
4. **Validar que no hay campos obligatorios que frontend no envía**

---

## 💻 AMBIENTE FRONTEND

**Package.json Scripts:**
```json
{
  "start": "ng serve --proxy-config proxy.conf.json",
  "build": "ng build",
  "watch": "ng build --watch --configuration development"
}
```

**Versiones:**
- Angular: 21.1.0
- TypeScript: 5.9.2
- Node: 20.x

**Servicios Implementados:**
- `UsuarioService` → GET, POST, PUT, DELETE `/api/usuarios`
- `AuthService` → Maneja tokens JWT
- `AuthInterceptor` → Agrega header `Authorization: Bearer {token}`

---

## 📞 CONTACTO

**Frontend Lead:** Brandon  
**Ambiente:** Desarrollo Local  
**Base de Datos:** MySQL - registrocalificado (localhost:3306)  

**Estado resumido:**
- ✅ Frontend listo para producción (excepto este bug)
- 🔴 Bloqueado por error 500 del backend en crear usuario
- **Estimado para resolver:** 1-2 horas una vez identifique el erro exacto del backend

