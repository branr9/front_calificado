import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  ImprovementFinding,
  PositiveFinding,
  RevisionGeneralDetailDTO
} from '../../core/models/revision-general.model';

@Component({
  selector: 'app-revision-general-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="overlay" (click)="onOverlayClick($event)" [class.open]="open">
      <aside class="drawer" role="dialog" aria-labelledby="rg-title">
        <header class="drawer-head">
          <div class="title-block">
            <span class="eyebrow">REVISIÓN GENERAL · IA</span>
            <h2 id="rg-title">{{ programaNombre || 'Programa' }}</h2>
          </div>
          <button class="close-btn" type="button" (click)="close.emit()" aria-label="Cerrar">
            <span [innerHTML]="closeSvg()"></span>
          </button>
        </header>

        @if (loading) {
          <div class="state state-loading">
            <div class="spinner" aria-hidden="true"></div>
            <h3>{{ loadingTitle || 'Analizando el documento…' }}</h3>
            <p>
              La IA está revisando todas las condiciones, secciones y evidencias del programa.
              Esto puede tardar entre 30 y 90 segundos. Puedes cerrar esta ventana —
              la revisión continúa y quedará guardada en el historial.
            </p>
            @if (elapsedSeconds !== null) {
              <div class="elapsed">Tiempo transcurrido: {{ elapsedSeconds }} s</div>
            }
          </div>
        } @else if (error) {
          <div class="state state-error">
            <span class="state-icon" [innerHTML]="alertSvg()"></span>
            <h3>No se pudo completar la revisión</h3>
            <p>{{ error }}</p>
            <button class="btn btn-primary" type="button" (click)="retry.emit()">
              Reintentar
            </button>
          </div>
        } @else if (result) {
          <div class="drawer-body">
            <!-- Summary -->
            <section class="summary">
              <div class="summary-label">RESUMEN GENERAL</div>
              <p>{{ result.summary || 'Sin resumen disponible.' }}</p>
              <div class="summary-meta">
                @if (result.modelUsado) {
                  <span class="meta-chip">Modelo: {{ result.modelUsado }}</span>
                }
                @if (result.conditionsAnalyzed) {
                  <span class="meta-chip">{{ result.conditionsAnalyzed }} condiciones</span>
                }
                @if (result.sectionsAnalyzed) {
                  <span class="meta-chip">{{ result.sectionsAnalyzed }} secciones</span>
                }
                @if (result.attachmentsConsidered) {
                  <span class="meta-chip">{{ result.attachmentsConsidered }} evidencias</span>
                }
                @if (result.ragContextUsed) {
                  <span class="meta-chip rag">RAG · {{ result.ragChunksCount || 0 }} fragmentos</span>
                }
                @if (result.durationMs) {
                  <span class="meta-chip">{{ (result.durationMs! / 1000) | number:'1.1-1' }} s</span>
                }
                @if (result.estimatedCostUsd) {
                  <span class="meta-chip">{{ result.estimatedCostUsd | number:'1.4-4' }} USD</span>
                }
              </div>
            </section>

            <!-- Positive findings -->
            <section class="findings findings-positive">
              <div class="findings-head">
                <span class="findings-icon" [innerHTML]="checkSvg()"></span>
                <h3>Cosas buenas <span class="count">{{ result.positiveFindings.length }}</span></h3>
              </div>
              @if (result.positiveFindings.length === 0) {
                <p class="empty">La IA no identificó fortalezas destacables en el contenido actual.</p>
              }
              @for (f of result.positiveFindings; track $index) {
                <article class="finding finding-positive">
                  <h4>{{ f.title }}</h4>
                  <p class="finding-desc">{{ f.description }}</p>

                  @if (f.relatedConditions?.length) {
                    <div class="chip-row">
                      <span class="chip-label">Condiciones:</span>
                      @for (c of f.relatedConditions; track c.id) {
                        <span class="chip chip-condition">#{{ c.number }} · {{ c.title }}</span>
                      }
                    </div>
                  }
                  @if (f.relatedSections?.length) {
                    <div class="chip-row">
                      <span class="chip-label">Secciones:</span>
                      @for (s of f.relatedSections; track s.code) {
                        <span class="chip chip-section">{{ s.code }}{{ s.name ? ' · ' + s.name : '' }}</span>
                      }
                    </div>
                  }
                  @if (f.relatedAttachments?.length) {
                    <div class="chip-row">
                      <span class="chip-label">Evidencias:</span>
                      @for (a of f.relatedAttachments; track $index) {
                        <span class="chip chip-attachment">{{ a.name }}</span>
                      }
                    </div>
                  }
                  @if (f.reason) {
                    <div class="finding-block">
                      <span class="block-label">Por qué es positivo:</span>
                      <span>{{ f.reason }}</span>
                    </div>
                  }
                  @if (f.recommendation) {
                    <div class="finding-block recommendation">
                      <span class="block-label">Recomendación:</span>
                      <span>{{ f.recommendation }}</span>
                    </div>
                  }
                </article>
              }
            </section>

            <!-- Improvement findings -->
            <section class="findings findings-improvement">
              <div class="findings-head">
                <span class="findings-icon warn" [innerHTML]="alertSvg()"></span>
                <h3>Cosas no tan buenas <span class="count">{{ result.improvementFindings.length }}</span></h3>
              </div>
              @if (result.improvementFindings.length === 0) {
                <p class="empty">La IA no identificó oportunidades de mejora urgentes.</p>
              }
              @for (f of result.improvementFindings; track $index) {
                <article class="finding finding-improvement"
                         [class.sev-low]="f.severity === 'LOW'"
                         [class.sev-medium]="f.severity === 'MEDIUM'"
                         [class.sev-high]="f.severity === 'HIGH'">
                  <div class="finding-head">
                    <h4>{{ f.title }}</h4>
                    <span class="severity"
                          [class.sev-low]="f.severity === 'LOW'"
                          [class.sev-medium]="f.severity === 'MEDIUM'"
                          [class.sev-high]="f.severity === 'HIGH'">
                      {{ severityLabel(f.severity) }}
                    </span>
                  </div>
                  <p class="finding-desc">{{ f.description }}</p>

                  @if (f.relatedConditions?.length) {
                    <div class="chip-row">
                      <span class="chip-label">Condiciones:</span>
                      @for (c of f.relatedConditions; track c.id) {
                        <span class="chip chip-condition">#{{ c.number }} · {{ c.title }}</span>
                      }
                    </div>
                  }
                  @if (f.relatedSections?.length) {
                    <div class="chip-row">
                      <span class="chip-label">Secciones:</span>
                      @for (s of f.relatedSections; track s.code) {
                        <span class="chip chip-section">{{ s.code }}{{ s.name ? ' · ' + s.name : '' }}</span>
                      }
                    </div>
                  }
                  @if (f.relatedAttachments?.length) {
                    <div class="chip-row">
                      <span class="chip-label">Evidencias:</span>
                      @for (a of f.relatedAttachments; track $index) {
                        <span class="chip chip-attachment">{{ a.name }}</span>
                      }
                    </div>
                  }
                  @if (f.risk) {
                    <div class="finding-block">
                      <span class="block-label">Riesgo:</span>
                      <span>{{ f.risk }}</span>
                    </div>
                  }
                  @if (f.recommendation) {
                    <div class="finding-block recommendation">
                      <span class="block-label">Recomendación:</span>
                      <span>{{ f.recommendation }}</span>
                    </div>
                  }
                </article>
              }
            </section>
          </div>
        }
      </aside>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .overlay {
      position: fixed; inset: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(2px);
      display: flex; justify-content: flex-end;
      z-index: 2000;
      opacity: 0; pointer-events: none;
      transition: opacity 0.2s ease;
    }
    .overlay.open { opacity: 1; pointer-events: auto; }

    .drawer {
      width: min(680px, 100vw);
      height: 100vh;
      background: #f8fafc;
      box-shadow: -16px 0 40px rgba(0,0,0,0.18);
      display: flex; flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.25s ease;
    }
    .overlay.open .drawer { transform: translateX(0); }

    .drawer-head {
      background: linear-gradient(135deg, #005c00 0%, #007b00 100%);
      color: #fff;
      padding: 1.5rem 1.75rem;
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem;
      box-shadow: 0 4px 14px rgba(0,92,0,0.18);
      flex-shrink: 0;
    }
    .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.6px; opacity: 0.85; }
    .title-block h2 { margin: 0.25rem 0 0; font-size: 22px; font-weight: 700; line-height: 1.2; color: #fff; }
    .close-btn {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      color: #fff;
      width: 36px; height: 36px;
      border-radius: 0.5rem;
      cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: background 0.15s ease;
    }
    .close-btn:hover { background: rgba(255,255,255,0.25); }
    .close-btn ::ng-deep svg { width: 18px; height: 18px; }

    .drawer-body { flex: 1; overflow-y: auto; padding: 1.5rem 1.75rem 4rem; }

    .summary {
      background: #fff;
      border-radius: 0.875rem;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      margin-bottom: 1.5rem;
    }
    .summary-label { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; }
    .summary p { margin: 0; color: #1f2937; line-height: 1.55; font-size: 14.5px; }
    .summary-meta { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.875rem; }
    .meta-chip {
      font-size: 11px;
      background: #f0f8f0;
      color: #006600;
      padding: 3px 9px;
      border-radius: 999px;
      font-weight: 600;
    }
    .meta-chip.rag { background: #eef5fa; color: #1d4ed8; }

    .findings { margin-bottom: 2rem; }
    .findings-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.875rem; }
    .findings-head h3 {
      font-size: 16px; font-weight: 700;
      color: #1f2937; margin: 0;
      display: inline-flex; align-items: center; gap: 0.5rem;
    }
    .findings-head .count {
      font-size: 11px; font-weight: 700;
      background: #e5e7eb; color: #4b5563;
      padding: 2px 8px; border-radius: 999px;
    }
    .findings-icon {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: #006600;
      color: #fff;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .findings-icon.warn { background: #f59e0b; }
    .findings-icon ::ng-deep svg { width: 16px; height: 16px; }

    .empty { font-size: 13px; color: #6b7280; font-style: italic; margin: 0.5rem 0 0; }

    .finding {
      background: #fff;
      border-radius: 0.75rem;
      padding: 1rem 1.125rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      margin-bottom: 0.75rem;
      border-left: 4px solid #006600;
    }
    .finding h4 { font-size: 14.5px; font-weight: 700; color: #1f2937; margin: 0 0 0.4rem; line-height: 1.3; }
    .finding-head { display: flex; align-items: center; gap: 0.5rem; justify-content: space-between; margin-bottom: 0.3rem; }
    .finding-desc { font-size: 13.5px; color: #374151; line-height: 1.55; margin: 0 0 0.625rem; }

    .finding.finding-improvement { border-left-color: #f59e0b; }
    .finding.finding-improvement.sev-high { border-left-color: #b91c1c; }
    .finding.finding-improvement.sev-medium { border-left-color: #f59e0b; }
    .finding.finding-improvement.sev-low { border-left-color: #94a3b8; }

    .severity {
      font-size: 10.5px; font-weight: 800;
      padding: 3px 9px; border-radius: 999px;
      text-transform: uppercase; letter-spacing: 0.4px;
      white-space: nowrap;
    }
    .severity.sev-high { background: #fee2e2; color: #b91c1c; }
    .severity.sev-medium { background: #fff8e1; color: #b45309; }
    .severity.sev-low { background: #f1f5f9; color: #475569; }

    .chip-row { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.4rem; }
    .chip-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .chip {
      font-size: 11.5px;
      padding: 3px 9px;
      border-radius: 999px;
      font-weight: 600;
      background: #f1f5f9;
      color: #1f2937;
    }
    .chip.chip-condition { background: #f0f8f0; color: #006600; }
    .chip.chip-section { background: #fef3c7; color: #92400e; }
    .chip.chip-attachment { background: #eef2ff; color: #4338ca; }

    .finding-block {
      margin-top: 0.5rem;
      font-size: 13px;
      color: #1f2937;
      line-height: 1.5;
    }
    .finding-block .block-label {
      font-weight: 700;
      color: #006600;
      margin-right: 0.25rem;
    }
    .finding-block.recommendation { background: #f0f8f0; padding: 0.5rem 0.75rem; border-radius: 0.5rem; }
    .finding-improvement .finding-block.recommendation { background: #fff8e1; }
    .finding-improvement.sev-high .finding-block.recommendation { background: #fee2e2; }
    .finding-block.recommendation .block-label { color: inherit; }

    .state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center;
      padding: 4rem 2rem;
      gap: 0.75rem;
      flex: 1;
    }
    .state h3 { margin: 0; font-size: 18px; font-weight: 700; color: #1f2937; }
    .state p { font-size: 14px; color: #6b7280; max-width: 380px; line-height: 1.55; margin: 0; }
    .state-icon ::ng-deep svg { width: 36px; height: 36px; color: #f59e0b; }

    .spinner {
      width: 48px; height: 48px;
      border: 4px solid #d1fae5;
      border-top-color: #006600;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .elapsed {
      margin-top: 0.5rem;
      font-size: 12.5px;
      color: #006600;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      background: #f0f8f0;
      padding: 4px 12px;
      border-radius: 999px;
    }

    .btn {
      padding: 0.6rem 1.1rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 13.5px;
      border: none;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s ease;
      margin-top: 0.5rem;
    }
    .btn-primary { background: #006600; color: #fff; }
    .btn-primary:hover { background: #005c00; }

    @media (max-width: 640px) {
      .drawer { width: 100vw; }
      .drawer-head { padding: 1rem 1.25rem; }
      .drawer-body { padding: 1rem 1.25rem 4rem; }
    }
  `]
})
export class RevisionGeneralPanelComponent {
  private sanitizer = inject(DomSanitizer);

  @Input() open = false;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() result: RevisionGeneralDetailDTO | null = null;
  @Input() programaNombre: string | null = null;
  /** Title shown while loading — defaults to "Analizando el documento…". */
  @Input() loadingTitle: string | null = null;
  /** When set, rendered under the loading state as elapsed seconds. */
  @Input() elapsedSeconds: number | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  protected readonly _positiveType!: PositiveFinding;
  protected readonly _improvementType!: ImprovementFinding;

  onOverlayClick(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) {
      this.close.emit();
    }
  }

  severityLabel(s: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    if (s === 'HIGH') return 'Alta';
    if (s === 'MEDIUM') return 'Media';
    return 'Baja';
  }

  closeSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
    );
  }

  checkSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    );
  }

  alertSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    );
  }
}
