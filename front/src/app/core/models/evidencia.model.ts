export interface EvidenciaDTO {
  id: number;
  nombreArchivoOriginal: string;
  tipoMime: string;
  tamanoBytes: number;
  fechaSubida: string;
  lineamientoId: number;
}

export interface EvidenciaUploadRequest {
  archivo: File;
  lineamientoId: number;
}

export interface DocumentoBaseDTO {
  id?: number;
  nombreArchivo: string;
  tipoDocumento: TipoDocumentoBase;
  tamanoBytes: number;
  fechaSubida?: string;
  programaId: number;
}

export enum TipoDocumentoBase {
  LINEAMIENTO = 'LINEAMIENTO',
  SECCION = 'SECCION',
  EVIDENCIA = 'EVIDENCIA',
  DOCUMENTO_BASE = 'DOCUMENTO_BASE'
}
