import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoDTO, DocumentoUploadRequest } from '../models/documento.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/documentos`;

  getDocumentos(): Observable<DocumentoDTO[]> {
    return this.http.get<DocumentoDTO[]>(this.apiUrl);
  }

  getDocumentosByPrograma(programaId: number): Observable<DocumentoDTO[]> {
    return this.http.get<DocumentoDTO[]>(`${this.apiUrl}/programa/${programaId}`);
  }

  getDocumento(id: number): Observable<DocumentoDTO> {
    return this.http.get<DocumentoDTO>(`${this.apiUrl}/${id}`);
  }

  uploadDocumento(request: DocumentoUploadRequest): Observable<DocumentoDTO> {
    const formData = new FormData();
    formData.append('archivo', request.archivo);
    formData.append('nombre', request.nombre);
    formData.append('area', request.area);
    formData.append('programaId', request.programaId.toString());
    
    if (request.descripcion) {
      formData.append('descripcion', request.descripcion);
    }

    return this.http.post<DocumentoDTO>(`${this.apiUrl}/upload`, formData);
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
