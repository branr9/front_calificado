import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoBaseDTO, TipoDocumentoBase } from '../models/evidencia.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentoBaseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/documentos-base`;

  getDocumentosByPrograma(programaId: number): Observable<DocumentoBaseDTO[]> {
    return this.http.get<DocumentoBaseDTO[]>(`${this.apiUrl}/programa/${programaId}`);
  }

  uploadDocumento(
    programaId: number, 
    archivo: File, 
    tipo: TipoDocumentoBase
  ): Observable<DocumentoBaseDTO> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('programaId', programaId.toString());
    formData.append('tipoDocumento', tipo);
    
    return this.http.post<DocumentoBaseDTO>(this.apiUrl, formData);
  }

  deleteDocumento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  downloadDocumento(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }
}
