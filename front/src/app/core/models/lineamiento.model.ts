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

export interface ComponenteCondicion3 {
  letra: 'A' | 'B' | 'C' | 'D' | 'E';
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
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
    nombre: 'Denominación del programa',
    icono: '📚',
    color: '#006600'
  },
  {
    numero: 2,
    nombre: 'Justificación del programa',
    icono: '🎓',
    color: '#007b00'
  },
  {
    numero: 3,
    nombre: 'Aspectos curriculares',
    icono: '✨',
    color: '#f093fb'
  },
  {
    numero: 4,
    nombre: 'Organización de actividades académicas y proceso formativo',
    icono: '👨‍🏫',
    color: '#4facfe'
  },
  {
    numero: 5,
    nombre: 'Investigación, innovación y/o creación artística y cultural',
    icono: '$',
    color: '#43e97b'
  },
  {
    numero: 6,
    nombre: 'Relación con el sector externo',
    icono: '🏗️',
    color: '#fa709a'
  },
  {
    numero: 7,
    nombre: 'Profesores',
    icono: '❤️',
    color: '#fee140'
  },
  {
    numero: 8,
    nombre: 'Medios educativos',
    icono: '🔬',
    color: '#30cfd0'
  },
  {
    numero: 9,
    nombre: 'Infraestructura física y tecnológica',
    icono: '🤝',
    color: '#a8edea'
  }
];

export const COMPONENTES_CONDICION_3: ComponenteCondicion3[] = [
  {
    letra: 'A',
    nombre: 'Componentes normativos',
    descripcion: 'Elementos normativos del programa',
    icono: '📋',
    color: '#006600'
  },
  {
    letra: 'B',
    nombre: 'Componentes pedagógicos',
    descripcion: 'Estrategias y métodos pedagógicos',
    icono: '🎓',
    color: '#007b00'
  },
  {
    letra: 'C',
    nombre: 'Componentes de interacción',
    descripcion: 'Elementos de interacción educativa',
    icono: '🔗',
    color: '#f093fb'
  },
  {
    letra: 'D',
    nombre: 'Conceptualización teórica y epistemológica',
    descripcion: 'Fundamentos teóricos del programa',
    icono: '🧠',
    color: '#4facfe'
  },
  {
    letra: 'E',
    nombre: 'Mecanismos de evaluación',
    descripcion: 'Procesos y herramientas de evaluación',
    icono: '✓',
    color: '#43e97b'
  }
];
