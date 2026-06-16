import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import { HistorialCambioDTO } from '../models/historial-cambio.model';

@Injectable({
  providedIn: 'root'
})
export class HistorialCambioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/historial`;

  listar(programaId?: number | null): Observable<HistorialCambioDTO[]> {
    let params = new HttpParams();
    if (programaId != null) {
      params = params.set('programaId', String(programaId));
    }
    return this.http.get<HistorialCambioDTO[]>(this.apiUrl, { params });
  }
}
