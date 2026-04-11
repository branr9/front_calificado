# 🚨 RESUMEN EJECUTIVO - ERROR MÓDULO USUARIOS

## El Problema

```
POST /api/usuarios → 500 Internal Server Error
Error: "Transaction silently rolled back because it has been marked as rollback-only"
```

## Frontend Status

| Aspecto | Estado |
|---------|--------|
| Angular App | ✅ Corriendo en :4200 |
| Proxy Config | ✅ Configurado |
| DTOs | ✅ Definidas |
| Servicios | ✅ Implementados |
| Validaciones | ✅ OK |
| **Crear Usuario** | 🔴 ERROR 500 |
| **Listar Usuarios** | 🔴 ERROR 500 |

## Datos que Envía (Correctos)

```json
{
  "username": "branr9",
  "email": "branr9quintero@gmail.com",
  "password": "admin123",
  "nombreCompleto": "brandon david quintero",
  "rol": "ADMINISTRADOR"
}
```

## Lo que Necesita el Backend

1. **Stack trace completo** del error en logs del backend
2. **Estructura de DTO CreateUsuarioDTO** que espera
3. **Cómo se mapea** el rol string a DB
4. **Validaciones** que tiene el Entity Usuario

## Tabla de Referencia - HTTP

```
GET    /api/usuarios              ← Lista todos (FALLA 500)
GET    /api/usuarios/{id}         ← Obtiene uno
POST   /api/usuarios              ← Crea (FALLA 500)
PUT    /api/usuarios/{id}         ← Actualiza
DELETE /api/usuarios/{id}         ← Elimina
POST   /api/usuarios/{id}/change-password
```

## Rol Disponibles en BD

```
ADMINISTRADOR ✅
FUNCIONARIO ✅
DOCENTE ✅
USUARIO ✅
ADMIN (duplicado)
DOCENTE_TEST (duplicado)
ESTUDIANTE (duplicado)
```

## Para Mostrar al Backend

"El frontend está funcional. Los datos se envían correctamente al puerto 8080.
El error 500 indica un problema en la lógica del backend al procesar 
la creación de usuarios. Necesitamos ver los logs del backend para 
identificar qué validación está fallando."

## Checkout Lists

- [ ] Backend compartió logs del error
- [ ] Backend compartió estructura del DTO
- [ ] Backend debuggó mapeo de rol
- [ ] Backend identificó validación que falla
- [ ] Backend arregló el error
- [ ] Frontend intenta de nuevo ✅

---

**Status:** 🔴 Blocking  
**Owner:** Backend Team  
**Urgency:** Medium (solo módulo usuarios está roto)
