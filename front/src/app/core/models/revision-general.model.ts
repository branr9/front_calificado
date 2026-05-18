/*
 * Shapes returned by the Spring Boot controller for the AI full-document
 * review feature. Three responses to know:
 *
 *   • RevisionGeneralJobDTO    — lightweight status (returned by POST and
 *                                by the polling endpoint).
 *   • RevisionGeneralDetailDTO — full persisted snapshot with all findings.
 *   • PositiveFinding / ImprovementFinding — the structured findings inside
 *                                a completed review.
 */

export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AttachmentRefType = 'EVIDENCE' | 'ATTACHMENT';
export type RevisionGeneralStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ConditionRef {
  id: number;
  number: number;
  title: string;
}

export interface SectionRef {
  id: number | null;
  code: string;
  name: string | null;
}

export interface AttachmentRef {
  id: number | null;
  name: string;
  type: AttachmentRefType;
}

export interface PositiveFinding {
  title: string;
  description: string;
  relatedConditions: ConditionRef[];
  relatedSections: SectionRef[];
  relatedAttachments: AttachmentRef[];
  reason: string;
  recommendation?: string | null;
}

export interface ImprovementFinding {
  title: string;
  description: string;
  relatedConditions: ConditionRef[];
  relatedSections: SectionRef[];
  relatedAttachments: AttachmentRef[];
  risk: string;
  recommendation: string;
  severity: FindingSeverity;
}

export type ConditionComplianceStatus = 'NO_INICIADO' | 'EN_PROGRESO' | 'COMPLETO' | 'OBSERVADO';

export interface ConditionAssessment {
  conditionId: number;
  conditionNumber: number;
  conditionTitle: string;
  progressPercent: number;
  complianceStatus: ConditionComplianceStatus;
  rationale: string;
}

/** Lightweight job status — returned by the start endpoint and by polling. */
export interface RevisionGeneralJobDTO {
  id: number;
  requestId: string;
  programaId: number | null;
  programaNombre: string | null;
  status: RevisionGeneralStatus;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  positiveCount: number;
  improvementCount: number;
}

/** Full persisted snapshot with all findings. */
export interface RevisionGeneralDetailDTO {
  id: number;
  requestId: string;
  programaId: number | null;
  programaNombre: string | null;
  status: RevisionGeneralStatus;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;

  summary: string | null;
  modelUsado: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
  durationMs: number | null;
  ragContextUsed: boolean | null;
  ragChunksCount: number | null;
  conditionsAnalyzed: number | null;
  sectionsAnalyzed: number | null;
  attachmentsConsidered: number | null;

  conditionAssessments: ConditionAssessment[];
  positiveFindings: PositiveFinding[];
  improvementFindings: ImprovementFinding[];
}
