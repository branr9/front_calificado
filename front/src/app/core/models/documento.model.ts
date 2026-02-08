export interface DocumentoDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  tipoDocumento: TipoDocumento;
  area: AreaDocumento;
  programaId: number;
  nombreArchivo: string;
  urlArchivo: string;
  tamanoBytes: number;
  fechaCarga: string;
  cargadoPor: string;
  estado: EstadoDocumento;
}

export enum TipoDocumento {
  PDF = 'PDF',
  WORD = 'WORD',
  EXCEL = 'EXCEL',
  IMAGEN = 'IMAGEN',
  OTRO = 'OTRO'
}

export enum AreaDocumento {
  FINANCIERA = 'FINANCIERA',
  BIENESTAR = 'BIENESTAR',
  ACADEMICA = 'ACADEMICA',
  ADMINISTRATIVA = 'ADMINISTRATIVA',
  INFRAESTRUCTURA = 'INFRAESTRUCTURA',
  INVESTIGACION = 'INVESTIGACION',
  EXTENSION = 'EXTENSION',
  DECRETO_1330 = 'DECRETO_1330',
  OTROS = 'OTROS'
}

export enum EstadoDocumento {
  PENDIENTE = 'PENDIENTE',
  PROCESADO = 'PROCESADO',
  ERROR = 'ERROR',
  VALIDADO = 'VALIDADO'
}

export interface DocumentoUploadRequest {
  nombre: string;
  descripcion?: string;
  area: AreaDocumento;
  programaId: number;
  archivo: File;
}

export const AREAS_CONFIG = [
  { value: AreaDocumento.ACADEMICA, label: 'Académica', icon: '📚', color: '#3f51b5' },
  { value: AreaDocumento.FINANCIERA, label: 'Financiera', icon: '💰', color: '#4caf50' },
  { value: AreaDocumento.BIENESTAR, label: 'Bienestar', icon: '❤️', color: '#e91e63' },
  { value: AreaDocumento.ADMINISTRATIVA, label: 'Administrativa', icon: '🏢', color: '#ff9800' },
  { value: AreaDocumento.INFRAESTRUCTURA, label: 'Infraestructura', icon: '🏗️', color: '#795548' },
  { value: AreaDocumento.INVESTIGACION, label: 'Investigación', icon: '🔬', color: '#9c27b0' },
  { value: AreaDocumento.EXTENSION, label: 'Extensión', icon: '🤝', color: '#00bcd4' },
  { value: AreaDocumento.DECRETO_1330, label: 'Decreto 1330', icon: '📜', color: '#f44336' },
  { value: AreaDocumento.OTROS, label: 'Otros', icon: '📎', color: '#607d8b' }
];
