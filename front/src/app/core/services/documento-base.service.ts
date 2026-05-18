import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoBaseDTO, DocumentoBaseScope } from '../models/documento-base.model';
import { environment } from '../config/environment';

export interface SubirDocumentoBaseRequest {
  file: File;
  scope: DocumentoBaseScope;
  programaId?: number | null;
  descripcion?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DocumentoBaseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/documentos-base`;

  /**
   * Documents applicable to a program — every NACIONAL plus every PROGRAMA
   * scoped to that program. When {@code programaId} is null, the backend
   * returns every document in the system.
   */
  list(programaId: number | null): Observable<DocumentoBaseDTO[]> {
    let params = new HttpParams();
    if (programaId != null) {
      params = params.set('programaId', String(programaId));
    }
    return this.http.get<DocumentoBaseDTO[]>(this.apiUrl, { params });
  }

  upload(req: SubirDocumentoBaseRequest): Observable<DocumentoBaseDTO> {
    const fd = new FormData();
    fd.append('file', req.file);
    fd.append('scope', req.scope);
    if (req.programaId != null) {
      fd.append('programaId', String(req.programaId));
    }
    if (req.descripcion) {
      fd.append('descripcion', req.descripcion);
    }
    return this.http.post<DocumentoBaseDTO>(this.apiUrl, fd);
  }

  download(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/descargar`, { responseType: 'blob' });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
