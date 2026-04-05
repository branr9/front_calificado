import { EstadoDocumentoRegistro } from './lineamiento.model';

export interface LineamientoTextoDTO {
  id?: number;
  programaId: number;
  numeroLineamiento: number;
  contenido: string;
  estado?: EstadoDocumentoRegistro | string;
  fechaActualizacion?: string;
}

export interface GenerarLineamientoRequest {
  prompt: string;
  contenidoActual?: string;
}

export interface GenerarLineamientoResponse {
  contenidoSugerido: string;
}

export interface DocumentoCompiladoDTO {
  programaId: number;
  contenido: string;
  estadoDocumento: EstadoDocumentoRegistro;
  fechaGeneracion?: string;
}
