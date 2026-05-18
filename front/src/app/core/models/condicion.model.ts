/*
 * View-models used by the /condiciones page. Built at runtime from real data
 * coming out of LineamientoService, SeccionService and EvidenciaService — no
 * mock data sneaks in here.
 */

export type CondicionStatus = 'complete' | 'progress' | 'empty';

export interface CondicionSubcomponente {
  letra: 'A' | 'B' | 'C' | 'D' | 'E';
  nombre: string;
  color: string;
}

/**
 * The single VM used to render a full document-style condition card. The right
 * sidebar (index) consumes only the lighter fields (numero/nombre/pct/status).
 */
export interface CondicionDocumentVM {
  numero: number;
  nombre: string;
  descripcion: string;
  color: string;
  status: CondicionStatus;
  /** 0–100. */
  pct: number;
  /** Words counted across all section content. */
  palabras: number;
  /** Formatted human string ("Hace 2 días", "12 mar 2026") or null when there is no signal. */
  ultimaActualizacion: string | null;
  sections: CondicionSeccionVM[];
  anexos: AnexoVM[];
  subcomponentes?: CondicionSubcomponente[];
  lineamientoId: number;
}

export interface CondicionSeccionVM {
  /** Heading shown above the paragraph in the document card. */
  h: string;
  /** The actual text the user wrote, or empty when the section is unredacted. */
  contenido: string;
}

export interface AnexoVM {
  id: number;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'zip' | 'img';
  updated: string;
}

export interface CondicionesGlobalStats {
  pct: number;
  programa: string;
  palabras: number;
  totalAnexos: number;
  condicionesCompletas: number;
  totalCondiciones: number;
}

export function statusFromPorcentaje(porcentaje: number): CondicionStatus {
  if (porcentaje >= 100) return 'complete';
  if (porcentaje > 0) return 'progress';
  return 'empty';
}

export function statusLabel(status: CondicionStatus): string {
  if (status === 'complete') return 'Completada';
  if (status === 'progress') return 'En progreso';
  return 'No iniciada';
}

export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Stable visual styling per condition number — kept here so the UI can render
 *  empty programs (no data yet) with the regulatory color/icon palette. */
export const CONDICION_COLORS: Record<number, string> = {
  1: '#006600',
  2: '#007b00',
  3: '#005c00',
  4: '#006600',
  5: '#007b00',
  6: '#005c00',
  7: '#006600',
  8: '#007b00',
  9: '#005c00'
};

/** Static, regulatory sub-components of condition 3 (Aspectos curriculares). */
export const CONDICION_3_SUBCOMPONENTES: CondicionSubcomponente[] = [
  { letra: 'A', nombre: 'Normativos', color: '#006600' },
  { letra: 'B', nombre: 'Pedagógicos', color: '#007b00' },
  { letra: 'C', nombre: 'Interacción', color: '#005c00' },
  { letra: 'D', nombre: 'Teóricos', color: '#006600' },
  { letra: 'E', nombre: 'Evaluación', color: '#007b00' }
];

/** Friendly extension → type tag used by AttachmentPanel. */
export function anexoTypeFromMime(mime: string | null | undefined, fallback: string | null | undefined = null): 'pdf' | 'docx' | 'xlsx' | 'zip' | 'img' {
  const m = (mime ?? '').toLowerCase();
  const fname = (fallback ?? '').toLowerCase();
  if (m.includes('pdf') || fname.endsWith('.pdf')) return 'pdf';
  if (m.includes('word') || fname.endsWith('.docx') || fname.endsWith('.doc')) return 'docx';
  if (m.includes('sheet') || m.includes('excel') || fname.endsWith('.xlsx') || fname.endsWith('.xls')) return 'xlsx';
  if (m.includes('zip') || fname.endsWith('.zip')) return 'zip';
  if (m.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(fname)) return 'img';
  return 'pdf';
}

export function humanFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * "Hace 2 días", "Hace 3 horas", "Hace un momento", or absolute date for
 * older signals — used by the document-card meta row.
 */
export function relativeOrAbsoluteDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diff = Date.now() - then;
  if (diff < 0) return formatAbsolute(then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hace 1 día';
  if (days < 30) return `Hace ${days} días`;
  return formatAbsolute(then);
}

function formatAbsolute(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}
