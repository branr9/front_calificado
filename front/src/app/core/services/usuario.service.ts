import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UsuarioDTO, CreateUsuarioDTO, UpdateUsuarioDTO } from '../models/usuario.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/usuarios`;

  // Mock de usuarios para desarrollo
  private mockUsuarios: UsuarioDTO[] = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@tuapp.com',
      nombreCompleto: 'Administrador General',
      rol: 'ADMINISTRADOR',
      activo: true,
      fechaCreacion: '2026-01-01'
    },
    {
      id: 2,
      username: 'funcionario1',
      email: 'funcionario1@tuapp.com',
      nombreCompleto: 'Juan Carlos Pérez',
      rol: 'FUNCIONARIO',
      activo: true,
      fechaCreacion: '2026-01-15'
    },
    {
      id: 3,
      username: 'docente1',
      email: 'docente1@tuapp.com',
      nombreCompleto: 'María García López',
      rol: 'DOCENTE',
      activo: true,
      fechaCreacion: '2026-02-01'
    },
    {
      id: 4,
      username: 'usuario1',
      email: 'usuario1@tuapp.com',
      nombreCompleto: 'Carlos Rodríguez Martínez',
      rol: 'USUARIO',
      activo: false,
      fechaCreacion: '2026-02-10'
    }
  ];

  private nextId = 5;

  getUsuarios(): Observable<UsuarioDTO[]> {
    // Intentar primero con el servidor real
    return this.http.get<UsuarioDTO[]>(this.apiUrl).pipe(
      catchError(() => {
        // Si falla, devolver mock
        console.warn('Backend no disponible, usando datos mock para usuarios');
        return of(this.mockUsuarios).pipe(delay(500));
      })
    );
  }

  getUsuario(id: number): Observable<UsuarioDTO> {
    return this.http.get<UsuarioDTO>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        // Mock
        const usuario = this.mockUsuarios.find(u => u.id === id);
        if (usuario) {
          return of(usuario).pipe(delay(300));
        }
        throw new Error('Usuario no encontrado');
      })
    );
  }

  createUsuario(usuario: CreateUsuarioDTO): Observable<UsuarioDTO> {
    return this.http.post<UsuarioDTO>(this.apiUrl, usuario).pipe(
      catchError(() => {
        // Mock
        const nuevoUsuario: UsuarioDTO = {
          id: this.nextId++,
          ...usuario,
          activo: true,
          fechaCreacion: new Date().toISOString()
        };
        this.mockUsuarios.push(nuevoUsuario);
        console.warn('Usuario creado en mock:', nuevoUsuario);
        return of(nuevoUsuario).pipe(delay(500));
      })
    );
  }

  updateUsuario(id: number, usuario: UpdateUsuarioDTO): Observable<UsuarioDTO> {
    return this.http.put<UsuarioDTO>(`${this.apiUrl}/${id}`, usuario).pipe(
      catchError(() => {
        // Mock
        const index = this.mockUsuarios.findIndex(u => u.id === id);
        if (index !== -1) {
          const usuarioActualizado = {
            ...this.mockUsuarios[index],
            ...usuario,
            fechaActualizacion: new Date().toISOString()
          };
          this.mockUsuarios[index] = usuarioActualizado;
          console.warn('Usuario actualizado en mock:', usuarioActualizado);
          return of(usuarioActualizado).pipe(delay(500));
        }
        throw new Error('Usuario no encontrado');
      })
    );
  }

  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        // Mock
        const index = this.mockUsuarios.findIndex(u => u.id === id);
        if (index !== -1) {
          this.mockUsuarios.splice(index, 1);
          console.warn('Usuario eliminado del mock');
          return of(void 0).pipe(delay(500));
        }
        throw new Error('Usuario no encontrado');
      })
    );
  }

  changePassword(id: number, oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/change-password`, {
      oldPassword,
      newPassword
    }).pipe(
      catchError(() => {
        console.warn('Contraseña cambiada en mock');
        return of(void 0).pipe(delay(300));
      })
    );
  }
}
