export type EstadoSeccion = 'BORRADOR' | 'EN_REVISION' | 'VALIDADA' | 'OBSERVADA';

export interface SeccionDTO {
  id: number;
  documentoId: number;
  lineamientoId: number;
  codigoSeccion: string;
  contenidoRedactado: string;
  observaciones: string;
  estado: EstadoSeccion;
}

export interface ActualizarSeccionRequest {
  contenidoRedactado: string;
  observaciones: string;
  estado: EstadoSeccion;
}

export interface IaRevisionResultDTO {
  nivelRiesgo: string;          // BAJO | MEDIO | ALTO
  observacionesGenerales: string;
  recomendacionesConcretas: string[];
  checklistCumplimiento: string[];
}
