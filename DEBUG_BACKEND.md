# Guía de Diagnóstico - Error 500 en Usuarios

## 🔴 Problema Principal
El backend retorna `HTTP 500` al crear/cargar usuarios. Esto significa que hay un error en el servidor.

---

## ✅ Lo que ya está bien en el Frontend

He corregido el warning de formularios reactivos. Ahora Angular maneja correctamente el ciclo de vida de los controles deshabilitados.

---

## 🔍 Pasos para Debuggear el Backend

### Paso 1: Verifica que el servidor está corriendo
```bash
# Abre PowerShell y ejecuta:
curl http://localhost:8080/api/usuarios -H "Authorization: Bearer tu-token"

# O en otra terminal:
netstat -ano | findstr :8080
```

### Paso 2: Revisa la configuración del proxy
**Archivo:** `front/proxy.conf.json`

Debe verse así:
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "pathRewrite": { "^/api": "" },
    "changeOrigin": true
  }
}
```

### Paso 3: Reproduce el error y captura detalles

#### En el Frontend (DevTools):
1. Abre `F12` → Network
2. Intenta crear un usuario
3. Busca la petición fallida (POST/GET /api/usuarios)
4. Click en Response → mira el mensaje de error exacto

#### En el Backend (logs):
- **Si es Java/Spring Boot:** Busca `ERROR` en la consola
- **Si es Node.js:** Busca el error completo en la terminal
- **Copia TODO el stack trace** para identificar el problema

### Paso 4: Problemas comunes

| Problema | Solución |
|----------|----------|
| **"Cannot find method"** | El endpoint no existe en el backend |
| **"NullPointerException"** | Un campo es null que no debería serlo |
| **"Invalid token/JWT"** | El token no es válido o expiró |
| **"Access denied"** | No hay permisos para la acción |
| **"Column not found"** | Base de datos no tiene esa columna |
| **"Connection refused"** | Backend no está corriendo |

---

## 📋 Checklist

- [ ] Backend está corriendo en puerto 8080 (o el que uses)
- [ ] proxy.conf.json apunta al server correcto
- [ ] Token de autenticación es válido
- [ ] Base de datos está conectada
- [ ] DTOs en backend coinciden con los que envía el frontend:
  ```json
  {
    "username": "jdoe",
    "email": "jdoe@ejemplo.com", 
    "password": "Pass1234",
    "nombreCompleto": "Juan Doe",
    "rol": "USUARIO"
  }
  ```

---

## 🆘 Si aún así no funciona

Ejecuta esto en la terminal del backend y comparte el FULL error:

```bash
# Si es Maven:
mvn clean install -e

# Si es Gradle:
gradle build -i

# Si es Node:
npm start

# Luego intenta crear un usuario y copia TODO el error
```

Comparte:
1. El endpoint exacto del backend (/usuarios, /users, etc.)
2. El método (POST, GET, etc.)
3. El error completo que ves en los logs
4. Las DTOs que espera el backend
