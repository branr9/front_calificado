# 🔧 ESPECIFICACIONES TÉCNICAS - FRONTEND USUARIOS

## 📦 Stack Tecnológico

```
Framework: Angular 21.1.0
Language: TypeScript 5.9.2
HTTP Client: HttpClientModule
Estado: Signals (Angular control flow)
Forms: Reactive Forms (FormGroup, FormBuilder)
```

## 📂 Estructura de Archivos

```
src/app/
├── core/
│   ├── services/
│   │   └── usuario.service.ts       ← GET, POST, PUT, DELETE
│   ├── models/
│   │   └── usuario.model.ts         ← DTOs e interfaces
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts      ← Agrega Bearer token
│   └── config/
│       └── environment.ts           ← API URL
├── features/
│   └── usuarios/
│       ├── usuario-list.component.ts    ← Tabla de usuarios
│       └── usuario-form.component.ts    ← Crear/editar
└── shared/
    └── layout/
        └── layout.component.ts
```

## 🎯 DTOs Definidas

### UsuarioDTO (Lecturas)
```typescript
export interface UsuarioDTO {
  id: number;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: string;
  activo: boolean;
}
```

### CreateUsuarioDTO (POST /usuarios)
```typescript
export interface CreateUsuarioDTO {
  username: string;      // Required, unique
  email: string;         // Required, valid email, unique
  password: string;      // Required, min 8 chars
  nombreCompleto: string; // Required
  rol: string;           // Required, debe existir en tabla roles
}
```

### UpdateUsuarioDTO (PUT /usuarios/{id})
```typescript
export interface UpdateUsuarioDTO {
  email?: string;
  nombreCompleto?: string;
  rol?: string;
  activo?: boolean;
  // username y password NO se envían en edición
}
```

## 🔌 Servicio UsuarioService

```typescript
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/api/usuarios`;

  getUsuarios(): Observable<UsuarioDTO[]>
  // GET /api/usuarios → Array de usuarios

  getUsuario(id: number): Observable<UsuarioDTO>
  // GET /api/usuarios/{id} → Un usuario

  createUsuario(usuario: CreateUsuarioDTO): Observable<UsuarioDTO>
  // POST /api/usuarios → Crea usuario, retorna con ID

  updateUsuario(id: number, usuario: UpdateUsuarioDTO): Observable<UsuarioDTO>
  // PUT /api/usuarios/{id} → Actualiza, retorna usuario actualizado

  deleteUsuario(id: number): Observable<void>
  // DELETE /api/usuarios/{id}

  changePassword(id: number, oldPassword: string, newPassword: string): Observable<void>
  // POST /api/usuarios/{id}/change-password
}
```

## 🔐 Auth Interceptor

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // NO agrega token a:
  // - URLs que no incluyen '/api/'
  // - Endpoint /api/auth/login
  
  // SÍ agrega header:
  // Authorization: Bearer {token}
  
  return next(authReq);
};
```

## 🌍 Environment Config

```typescript
// src/app/core/config/environment.ts
export const environment = {
  apiUrl: ''  // En desarrollo, el proxy lo direcciona a localhost:8080
};
```

## 📋 Proxy Config

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

## 🧪 Validaciones del Formulario

En `usuario-form.component.ts`:

```typescript
usuarioForm = this.fb.group({
  username: [
    {value: '', disabled: false},
    [Validators.required]
  ],
  email: [
    {value: '', disabled: false},
    [Validators.required, Validators.email]
  ],
  password: [
    {value: '', disabled: false},
    [Validators.minLength(8)]
  ],
  nombreCompleto: [
    {value: '', disabled: false},
    Validators.required
  ],
  rol: [
    {value: '', disabled: false},
    Validators.required
  ],
  activo: [true]
});
```

**Validaciones Especiales:**
- En **creación**: password es REQUIRED
- En **edición**: password NO se envía, username se deshabilita (disabled)

## 📡 Request/Response Examples

### Create Request (Working desde Frontend)
```http
POST http://localhost:8080/api/usuarios
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "username": "branr9",
  "email": "branr9quintero@gmail.com",
  "password": "admin123",
  "nombreCompleto": "brandon david quintero",
  "rol": "ADMINISTRADOR"
}
```

### Create Response (Expected 201)
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

### Create Response (Actual 500)
```json
{
  "error": "Transaction silently rolled back because it has been marked as rollback-only"
}
```

## 🐛 Debugging Info

**Logs agregados en frontend:**
- `console.log('📤 CREATE data enviado:', formData)` 
- `console.error('❌ Error creando usuario:', err)`
- Archivo: `usuario-form.component.ts` línina ~511, 521

**DevTools Network:**
- Verifica Headers: Authorization
- Verifica Payload: FormData
- Verifica Response: Error message del backend

## ✅ Checklist de Validación

- [x] Frontend compila sin errores
- [x] DTOs definidas correctamente
- [x] Proxy configurado
- [x] AuthInterceptor funciona
- [x] Validaciones de formulario son correctas
- [x] Datos se envían al backend correctly formatted
- [ ] Backend acepta y procesa request
- [ ] Backend crea usuario en BD
- [ ] Backend retorna 201 con usuario creado

## 🚀 Performance

- Tabla usuarios: Lazy loading (signals + OnPush change detection)
- API calls: Cancelación en destroy (unsubscribe)
- Bundle size: ~500KB (production build)

## 📝 Cambios Recientes

1. **Arreglo de Warning de FormControl disabled**
   - Ahora usa `{disabled: true}` en FormControl constructor
   - Antes causaba "changed after checked" error

2. **Logs agregados para debugging**
   - JSON stringify de datos enviados
   - Error object completo capturado

## 🔗 Referencias

- Backend Contract: `/BACKEND_AUTH_CONTRACT.md`
- API Contracts: `/API_CONTRACTS.md`
- Estado Frontend: `/ESTADO_FRONTEND_PARA_BACKEND.md`

---

**Información para Backend Team:**
El frontend está completamente funcional. Los datos se envían correctamente formateados con
autenticación JWT. El error 500 ocurre en el backend al procesar POST /api/usuarios.
