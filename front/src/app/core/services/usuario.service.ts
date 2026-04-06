import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioDTO, CreateUsuarioDTO, UpdateUsuarioDTO } from '../models/usuario.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/usuarios`;

  getUsuarios(): Observable<UsuarioDTO[]> {
    return this.http.get<UsuarioDTO[]>(this.apiUrl);
  }

  getUsuario(id: number): Observable<UsuarioDTO> {
    return this.http.get<UsuarioDTO>(`${this.apiUrl}/${id}`);
  }

  createUsuario(usuario: CreateUsuarioDTO): Observable<UsuarioDTO> {
    return this.http.post<UsuarioDTO>(this.apiUrl, usuario);
  }

  updateUsuario(id: number, usuario: UpdateUsuarioDTO): Observable<UsuarioDTO> {
    return this.http.put<UsuarioDTO>(`${this.apiUrl}/${id}`, usuario);
  }

  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  changePassword(id: number, oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/change-password`, {
      oldPassword,
      newPassword
    });
  }
}
