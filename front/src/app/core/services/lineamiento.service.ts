import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  EstadoDocumentoRegistro,
  LINEAMIENTOS_DECRETO_1330,
  LineamientoDTO,
  ProgresoRegistroDTO
} from '../models/lineamiento.model';
import { environment } from '../config/environment';

/**
 * Shape actually returned by Spring Boot. Field names differ from the
 * frontend's {@link LineamientoDTO} for legacy reasons, so we adapt here
 * instead of touching every consumer.
 */
interface BackendLineamiento {
  id: number;
  programaId: number;
  numero: number;
  titulo: string;
  descripcion: string;
  estadoCumplimiento: string | null;
  avancePorcentual: number | null;
}

function adapt(b: BackendLineamiento): LineamientoDTO {
  const ref = LINEAMIENTOS_DECRETO_1330.find(l => l.numero === b.numero);
  const porcentaje = b.avancePorcentual ?? 0;
  return {
    id: b.id,
    programaId: b.programaId,
    numero: b.numero,
    nombre: b.titulo || ref?.nombre || `Condición ${b.numero}`,
    descripcion: b.descripcion ?? '',
    icono: ref?.icono ?? '',
    porcentaje,
    completado: porcentaje >= 100
  };
}

@Injectable({
  providedIn: 'root'
})
export class LineamientoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/lineamientos`;

  getLineamientos(programaId: number): Observable<LineamientoDTO[]> {
    return this.http
      .get<BackendLineamiento[]>(`${this.apiUrl}/programa/${programaId}`)
      .pipe(map(arr => (arr ?? []).map(adapt)));
  }

  getLineamiento(id: number): Observable<LineamientoDTO> {
    return this.http
      .get<BackendLineamiento>(`${this.apiUrl}/${id}`)
      .pipe(map(adapt));
  }

  updateLineamiento(id: number, lineamiento: Partial<LineamientoDTO>): Observable<LineamientoDTO> {
    const payload = {
      titulo: lineamiento.nombre,
      descripcion: lineamiento.descripcion,
      avancePorcentual: lineamiento.porcentaje
    };

    return this.http
      .put<BackendLineamiento>(`${this.apiUrl}/${id}`, payload)
      .pipe(map(adapt));
  }

  /**
   * Aggregated progress for a program. The backend does not currently expose
   * a {@code /progreso} endpoint, so we derive it from the lineamientos
   * themselves. Kept as a method so existing consumers (dashboard) keep
   * working unchanged.
   */
  getProgreso(programaId: number): Observable<ProgresoRegistroDTO> {
    return this.getLineamientos(programaId).pipe(
      map((lineamientos) => {
        const total = lineamientos.length;
        const completados = lineamientos.filter(l => l.porcentaje >= 100).length;
        const enProgreso = lineamientos.filter(l => l.porcentaje > 0 && l.porcentaje < 100).length;
        const noIniciados = total - completados - enProgreso;
        const porcentajeTotal = total === 0
          ? 0
          : Math.round(lineamientos.reduce((s, l) => s + l.porcentaje, 0) / total);
        return {
          programaId,
          lineamientosCompletados: completados,
          lineamientosEnProgreso: enProgreso,
          lineamientosNoIniciados: noIniciados,
          porcentajeTotal,
          palabrasDocumento: 0,
          estadoDocumento: EstadoDocumentoRegistro.BORRADOR
        };
      })
    );
  }
}
