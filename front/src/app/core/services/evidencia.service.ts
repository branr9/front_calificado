import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EvidenciaDTO } from '../models/evidencia.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class EvidenciaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/evidencias`;

  getEvidenciasByLineamiento(lineamientoId: number): Observable<EvidenciaDTO[]> {
    return this.http.get<EvidenciaDTO[]>(`${this.apiUrl}/lineamiento/${lineamientoId}`);
  }

  uploadEvidencia(lineamientoId: number, archivo: File): Observable<EvidenciaDTO> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('lineamientoId', lineamientoId.toString());
    
    return this.http.post<EvidenciaDTO>(this.apiUrl, formData);
  }

  deleteEvidencia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  downloadEvidencia(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }
}
