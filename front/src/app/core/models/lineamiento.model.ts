export interface LineamientoDTO {
  id: number;
  numero: number;
  nombre: string;
  descripcion: string;
  icono: string;
  completado: boolean;
  porcentaje: number;
  programaId: number;
}

export interface ProgresoRegistroDTO {
  programaId: number;
  lineamientosCompletados: number;
  lineamientosEnProgreso: number;
  lineamientosNoIniciados: number;
  porcentajeTotal: number;
  palabrasDocumento: number;
  estadoDocumento: EstadoDocumentoRegistro;
  fechaGeneracion?: string;
}

export enum EstadoDocumentoRegistro {
  BORRADOR = 'BORRADOR',
  EN_REVISION = 'EN_REVISION',
  APROBADO = 'APROBADO',
  ENVIADO = 'ENVIADO'
}

export const LINEAMIENTOS_DECRETO_1330 = [
  {
    numero: 1,
    nombre: 'Naturaleza y características',
    icono: '📚',
    color: '#667eea'
  },
  {
    numero: 2,
    nombre: 'Acceso y admisión',
    icono: '🎓',
    color: '#764ba2'
  },
  {
    numero: 3,
    nombre: 'Administración académica',
    icono: '✨',
    color: '#f093fb'
  },
  {
    numero: 4,
    nombre: 'Profesores',
    icono: '👨‍🏫',
    color: '#4facfe'
  },
  {
    numero: 5,
    nombre: 'Procesos académicos',
    icono: '$',
    color: '#43e97b'
  },
  {
    numero: 6,
    nombre: 'Infraestructura',
    icono: '🏗️',
    color: '#fa709a'
  },
  {
    numero: 7,
    nombre: 'Bienestar institucional',
    icono: '❤️',
    color: '#fee140'
  },
  {
    numero: 8,
    nombre: 'Investigación',
    icono: '🔬',
    color: '#30cfd0'
  },
  {
    numero: 9,
    nombre: 'Extensión',
    icono: '🤝',
    color: '#a8edea'
  }
];
