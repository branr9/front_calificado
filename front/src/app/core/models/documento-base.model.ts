export type DocumentoBaseScope = 'NACIONAL' | 'PROGRAMA';

export interface DocumentoBaseDTO {
  id: number;
  scope: DocumentoBaseScope;
  nombre: string;
  descripcion: string | null;
  tipoMime: string;
  tamanoBytes: number;
  programaId: number | null;
  iaSourceId: string | null;
  indexado: boolean;
  fechaSubida: string;
  subidoPor: string | null;
}

export const SCOPE_LABEL: Record<DocumentoBaseScope, string> = {
  NACIONAL: 'Nacional',
  PROGRAMA: 'Programa'
};

export const SCOPE_DESCRIPTION: Record<DocumentoBaseScope, string> = {
  NACIONAL: 'Aplica a las 9 condiciones de todos los programas (p. ej. Decreto 1330).',
  PROGRAMA: 'Aplica a las 9 condiciones del programa seleccionado (p. ej. plan curricular).'
};
