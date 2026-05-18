export type EstadoSeccion = 'BORRADOR' | 'EN_REVISION' | 'VALIDADA' | 'OBSERVADA';

export interface SeccionDTO {
  id: number;
  documentoId: number;
  lineamientoId: number;
  codigoSeccion: string;
  titulo: string;
  orden?: number;
  contenidoRedactado: string;
  observaciones: string;
  estado: EstadoSeccion;
}

export interface ActualizarSeccionRequest {
  codigoSeccion?: string;
  titulo?: string;
  orden?: number;
  contenidoRedactado?: string;
  observaciones?: string;
  estado: EstadoSeccion;
}

export interface CrearSeccionRequest {
  codigoSeccion: string;
  titulo: string;
  orden?: number;
}

export interface IaRevisionResultDTO {
  nivelRiesgo: string;          // BAJO | MEDIO | ALTO
  observacionesGenerales: string;
  recomendacionesConcretas: string[];
  checklistCumplimiento: string[];
  citas: IaCitationDTO[];
  modeloUsado?: string;
  costoEstimadoUsd?: number;
  cacheHit?: boolean;
  aiCalled?: boolean;
  insufficientContext?: boolean;
  retrievalDiagnostics?: IaRetrievalDiagnosticsDTO;
}

export interface IaCitationDTO {
  sourceId: string;
  chunkId: string;
  sourceName?: string;
  quote: string;
  pageStart?: number;
  pageEnd?: number;
}

export interface IaRetrievalDiagnosticsDTO {
  query: string;
  topK: number;
  threshold: number;
  rawResultsFound: number;
  resultsAfterThreshold: number;
  maxSimilarity?: number;
  minSimilarityFound?: number;
  thresholdRemovedAll?: boolean;
  candidateSimilarities: IaCandidateSimilarityDTO[];
}

export interface IaCandidateSimilarityDTO {
  chunkId: string;
  sourceName: string;
  lineamiento?: number;
  documentType: string;
  similarity: number;
}

export type RecomendarTextoMode = 'CREATE' | 'IMPROVE';

export interface RecomendarTextoRequest {
  mode?: RecomendarTextoMode;
  userInstruction?: string;
}

export interface RecomendarTextoUsedContextItem {
  tipo: 'CONDITION' | 'SECTION' | 'ATTACHMENT' | 'PROGRAM' | 'NORMATIVE';
  nombre: string;
}

export interface RecomendarTextoResponse {
  suggestedTitle?: string | null;
  suggestedText: string;
  rationale: string;
  usedContext: RecomendarTextoUsedContextItem[];
  warnings: string[];
  modeUsed: RecomendarTextoMode;
  modeloUsado?: string | null;
  costoEstimadoUsd?: number | null;
  cacheHit?: boolean;
  aiCalled?: boolean;
  insufficientContext?: boolean;
}
