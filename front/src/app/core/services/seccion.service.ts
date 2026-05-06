import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import { ActualizarSeccionRequest, IaRevisionResultDTO, SeccionDTO } from '../models/seccion.model';

@Injectable({ providedIn: 'root' })
export class SeccionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/secciones`;
  private registroCalificadoUrl = `${environment.apiUrl}/api/registro-calificado`;

  getByLineamiento(lineamientoId: number): Observable<SeccionDTO[]> {
    return this.http.get<SeccionDTO[]>(`${this.apiUrl}/lineamiento/${lineamientoId}`);
  }

  /** Upsert: creates or updates the section for a lineamiento. Always works. */
  guardar(lineamientoId: number, req: ActualizarSeccionRequest): Observable<SeccionDTO> {
    return this.http.post<SeccionDTO>(`${this.apiUrl}/lineamiento/${lineamientoId}/guardar`, req);
  }

  actualizar(id: number, req: ActualizarSeccionRequest): Observable<SeccionDTO> {
    return this.http.put<SeccionDTO>(`${this.apiUrl}/${id}`, req);
  }

  revisarConIA(id: number): Observable<IaRevisionResultDTO> {
    return this.http.post<IaRevisionResultDTO>(`${this.registroCalificadoUrl}/secciones/${id}/ia/revisar`, {});
  }
}
