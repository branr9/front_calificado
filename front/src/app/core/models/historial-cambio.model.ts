export interface HistorialCambioDTO {
  id: number;
  accion: string;
  entidad: string;
  programaId?: number;
  programaNombre?: string;
  lineamientoId?: number;
  condicionNumero?: number;
  condicionTitulo?: string;
  seccionId?: number;
  seccionCodigo?: string;
  evidenciaId?: number;
  username: string;
  nombreCompleto?: string;
  rol?: string;
  fecha: string;
  detalle?: string;
}
