import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DocumentoCompiladoDTO,
  GenerarLineamientoRequest,
  GenerarLineamientoResponse,
  LineamientoTextoDTO
} from '../models/lineamiento-texto.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class LineamientoTextoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/lineamientos`;

  /** Obtiene el texto guardado para un lineamiento concreto. */
  getTexto(programaId: number, numeroLineamiento: number): Observable<LineamientoTextoDTO | null> {
    return this.http.get<LineamientoTextoDTO | null>(
      `${this.apiUrl}/programa/${programaId}/lineamiento/${numeroLineamiento}/texto`
    );
  }

  /** Solicita al backend que genere o mejore el texto usando IA. */
  generarTexto(
    programaId: number,
    numeroLineamiento: number,
    body: GenerarLineamientoRequest
  ): Observable<GenerarLineamientoResponse> {
    return this.http.post<GenerarLineamientoResponse>(
      `${this.apiUrl}/programa/${programaId}/lineamiento/${numeroLineamiento}/generar`,
      body
    );
  }

  /** Guarda el texto actual del lineamiento (crea o actualiza). */
  guardarTexto(
    programaId: number,
    numeroLineamiento: number,
    contenido: string
  ): Observable<LineamientoTextoDTO> {
    return this.http.post<LineamientoTextoDTO>(
      `${this.apiUrl}/programa/${programaId}/lineamiento/${numeroLineamiento}/texto`,
      { contenido }
    );
  }

  /** Recupera el documento completo compilado con los 9 lineamientos. */
  getDocumentoCompilado(programaId: number): Observable<DocumentoCompiladoDTO> {
    return this.http.get<DocumentoCompiladoDTO>(
      `${this.apiUrl}/programa/${programaId}/documento-completo`
    );
  }
}
