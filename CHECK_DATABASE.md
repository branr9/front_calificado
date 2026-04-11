# Verificar y Arreglar Base de Datos

## Conecta a MySQL:
```bash
mysql -u root -p registrocalificado
```

## Luego ejecuta estos comandos:

### 1. Ver estructura de tabla usuarios
```sql
DESCRIBE usuarios;
```

### 2. Ver roles existentes
```sql
SELECT * FROM roles;
```

### 3. Si la tabla roles está vacía, EJECUTA ESTO:
```sql
INSERT INTO roles (nombre, descripcion) VALUES
('ADMINISTRADOR', 'Control total del sistema'),
('FUNCIONARIO', 'Acceso a dashboard y programas'),
('DOCENTE', 'Docente del sistema'),
('USUARIO', 'Usuario regular');
```

### 4. Verifica que se insertaron:
```sql
SELECT * FROM roles;
```

### 5. Verifica si hay usuarios duplicados:
```sql
SELECT * FROM usuarios WHERE username = 'branr9' OR email = 'branr9quintero@gmail.com';
```

---

## **CRÍTICO: Si los roles no existen, el backend falla al intentar crear usuario**

Cuando el backend intenta:
```java
Usuario usuario = new Usuario();
usuario.setUsername("branr9");
usuario.setEmail("branr9quintero@gmail.com");
usuario.setRol(Rol.ADMINISTRADOR); // <- BUSCA EN BD
// Si no encuentra el rol → NullPointerException → Transaction rollback
```

---

## Copia aquí los resultados:

1. **Output de:** `DESCRIBE usuarios;`
2. **Output de:** `SELECT * FROM roles;`
3. **Output de:** `SELECT * FROM usuarios;` (últimas filas)
4. **Los logs del backend** cuando intentas crear usuario (si tienes acceso)
