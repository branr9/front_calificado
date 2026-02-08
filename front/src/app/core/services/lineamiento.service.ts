import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LineamientoDTO, ProgresoRegistroDTO } from '../models/lineamiento.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class LineamientoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/lineamientos`;

  getLineamientos(programaId: number): Observable<LineamientoDTO[]> {
    return this.http.get<LineamientoDTO[]>(`${this.apiUrl}/programa/${programaId}`);
  }

  getLineamiento(id: number): Observable<LineamientoDTO> {
    return this.http.get<LineamientoDTO>(`${this.apiUrl}/${id}`);
  }

  updateLineamiento(id: number, lineamiento: Partial<LineamientoDTO>): Observable<LineamientoDTO> {
    return this.http.put<LineamientoDTO>(`${this.apiUrl}/${id}`, lineamiento);
  }

  getProgreso(programaId: number): Observable<ProgresoRegistroDTO> {
    return this.http.get<ProgresoRegistroDTO>(`${this.apiUrl}/programa/${programaId}/progreso`);
  }
}
