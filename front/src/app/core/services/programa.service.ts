import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProgramaDTO } from '../models/programa.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class ProgramaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/programas`;

  getProgramas(): Observable<ProgramaDTO[]> {
    return this.http.get<ProgramaDTO[]>(this.apiUrl);
  }

  getPrograma(id: number): Observable<ProgramaDTO> {
    return this.http.get<ProgramaDTO>(`${this.apiUrl}/${id}`);
  }

  createPrograma(programa: Omit<ProgramaDTO, 'id'>): Observable<ProgramaDTO> {
    return this.http.post<ProgramaDTO>(this.apiUrl, programa);
  }

  updatePrograma(id: number, programa: Omit<ProgramaDTO, 'id'>): Observable<ProgramaDTO> {
    return this.http.put<ProgramaDTO>(`${this.apiUrl}/${id}`, programa);
  }

  deletePrograma(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  exportarZip(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/exportar-zip`, { responseType: 'blob' });
  }
}
