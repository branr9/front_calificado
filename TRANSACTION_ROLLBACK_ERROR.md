# 🔴 Error: Transaction silently rolled back

## Problema Exacto
```
'Transaction silently rolled back because it has been marked as rollback-only'
```

Este error ocurre cuando **una validación falla dentro de una transacción Spring**.

---

## 🎯 Causas Probables (en orden de probabilidad)

### 1️⃣ **Campo `rol` no coincide con estructura BD** ⚠️ MÁS PROBABLE
**Frontend envía:**
```json
{
  "username": "jdoe",
  "email": "jdoe@example.com",
  "password": "Pass1234",
  "nombreCompleto": "Juan Doe",
  "rol": "ADMINISTRADOR"
}
```

**BD espera:**
```json
{
  "username": "jdoe",
  "email": "jdoe@example.com",
  "passwordHash": "hash_aqui",
  "nombreCompleto": "Juan Doe",
  "rolId": 1
}
```

**Solución:** El backend debe convertir `"rol": "ADMINISTRADOR"` a `rolId`, buscando en tabla `roles`.

---

### 2️⃣ **Rol No Existe en Base de Datos**
Si intentas crear usuario con rol que no existe:

```sql
-- Verificar roles disponibles:
SELECT * FROM roles;

-- Insertar si faltan:
INSERT INTO roles (nombre, descripcion) VALUES
('ADMINISTRADOR', 'Control total del sistema'),
('FUNCIONARIO', 'Acceso a dashboard y programas'),
('DOCENTE', 'Docente del sistema'),
('USUARIO', 'Usuario regular');
```

---

### 3️⃣ **Username o Email Ya Existe**
Ambos tienen UNIQUE en la BD. Si intentas crear en duplicado → rollback.

```sql
-- Verifica si ya existen:
SELECT * FROM usuarios WHERE username = 'jdoe' OR email = 'jdoe@example.com';
```

---

### 4️⃣ **Campo Requerido es NULL**
Si `nombreCompleto` es null pero es NOT NULL en la BD:

```sql
-- Verifica estructura:
DESCRIBE usuarios;
```

---

### 5️⃣ **Validación en el Entity (Annotations)**
Si el backend usa:
```java
@NotBlank(message = "Username no puede ser vacío")
@NotNull(message = "Email es requerido")
private String email;
```

Y alguna validación falla → rollback silencioso.

---

## 🔧 Soluciones

### Opción A: Ver Logs del Backend
En la terminal donde corre el backend (Spring Boot):

```
ERROR o WARN - busca esta línea antes del rollback
javax.validation.ConstraintViolationException
org.hibernate.exception.ConstraintViolationException
```

Comparte **TODO EL STACK TRACE** que aparezca antes de "rollback-only".

---

### Opción B: Verificar BD (MySQL)

```sql
-- Conecta a la BD
mysql -u root -p registrocalificado

-- Verifica tabla
DESCRIBE usuarios;

-- Verifica roles
SELECT * FROM roles;

-- Verifica si el usuario existe
SELECT * FROM usuarios WHERE username = 'jdoe';

-- Verifica constraints
SHOW CREATE TABLE usuarios\G
```

---

### Opción C: Debuggear Frontend

En la consola del navegador (F12), cuando falla, imprime qué se está enviando:

```typescript
// Agrega esto en usuario-form.component.ts línea antes de submit
protected onSubmit(): void {
  if (!this.usuarioForm.valid) return;
  
  const formData = this.usuarioForm.getRawValue();
  
  // 🔍 VER QUÉ SE ENVÍA
  console.log('📤 Datos a enviar al backend:', JSON.stringify(formData, null, 2));
  
  this.saving.set(true);
  // ... resto del código
}
```

Luego copia exactamente lo que ves en consola y comparte.

---

## ✅ Para Confirmar el Fix

Una vez arreglado:

1. Intenta crear usuario con rol = "ADMINISTRADOR"
2. Verifica en BD:
   ```sql
   SELECT * FROM usuarios ORDER BY id DESC LIMIT 1;
   ```
3. Si ves el registro → ✅ ARREGLADO

---

## 📞 Información que Necesito

Para arreglar definitivamente, responde:

1. **¿Dónde está el backend?** (otro repo, misma máquina en puerto 8080, etc.)
2. **¿Qué framework?** (Spring Boot, Node.js, PHP, etc.)
3. **Error exacto en logs del backend** (copia el stack trace completo)
4. **Resultado de:**
   ```sql
   SELECT * FROM roles;
   SELECT * FROM usuarios;
   ```
5. **DTO CreateUsuarioDTO o similar** que espera el backend (si puedes compartir código)
