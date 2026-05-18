import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  ActualizarSeccionRequest,
  CrearSeccionRequest,
  IaRevisionResultDTO,
  RecomendarTextoRequest,
  RecomendarTextoResponse,
  SeccionDTO
} from '../models/seccion.model';

@Injectable({ providedIn: 'root' })
export class SeccionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/secciones`;

  getByLineamiento(lineamientoId: number): Observable<SeccionDTO[]> {
    return this.http.get<SeccionDTO[]>(`${this.apiUrl}/lineamiento/${lineamientoId}`);
  }

  /** Upsert: creates or updates the section for a lineamiento. Always works. */
  guardar(lineamientoId: number, req: ActualizarSeccionRequest): Observable<SeccionDTO> {
    return this.http.post<SeccionDTO>(`${this.apiUrl}/lineamiento/${lineamientoId}/guardar`, req);
  }

  crear(lineamientoId: number, req: CrearSeccionRequest): Observable<SeccionDTO> {
    return this.http.post<SeccionDTO>(`${this.apiUrl}/lineamiento/${lineamientoId}`, req);
  }

  actualizar(id: number, req: ActualizarSeccionRequest): Observable<SeccionDTO> {
    return this.http.put<SeccionDTO>(`${this.apiUrl}/${id}`, req);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  revisarConIA(id: number): Observable<IaRevisionResultDTO> {
    return this.http.post<IaRevisionResultDTO>(`${this.apiUrl}/${id}/ia/revision`, {});
  }

  recomendarTextoIA(id: number, body: RecomendarTextoRequest = {}): Observable<RecomendarTextoResponse> {
    return this.http.post<RecomendarTextoResponse>(`${this.apiUrl}/${id}/ia/recomendar-texto`, body);
  }
}
