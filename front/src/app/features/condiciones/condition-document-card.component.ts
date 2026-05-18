import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AnexoVM, CondicionDocumentVM, statusLabel } from '../../core/models/condicion.model';
import { AttachmentPanelComponent } from './attachment-panel.component';

@Component({
  selector: 'app-condition-document-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, AttachmentPanelComponent],
  template: `
    <article class="doc-card" [id]="cardDomId()" [attr.data-numero]="data.numero">
      <div class="doc-card-top" [style.background]="data.color"></div>

      <header class="doc-card-head">
        <div class="head-text">
          <div class="cond-label">CONDICIÓN {{ paddedNumero() }}</div>
          <h2 class="cond-title">{{ data.nombre }}</h2>
          <div class="cond-meta">
            <span class="status-pill"
                  [class.status-complete]="data.status === 'complete'"
                  [class.status-progress]="data.status === 'progress'"
                  [class.status-empty]="data.status === 'empty'">
              <span class="dot"></span>{{ statusText() }}
            </span>
            <span class="meta-sep">·</span>
            <span class="meta-item">{{ data.palabras | number }} palabras</span>
            <span class="meta-sep">·</span>
            <span class="meta-item">{{ data.anexos.length }} anexo{{ data.anexos.length === 1 ? '' : 's' }}</span>
            @if (data.ultimaActualizacion) {
              <span class="meta-sep">·</span>
              <span class="meta-item">Actualizado: {{ data.ultimaActualizacion }}</span>
            }
          </div>
        </div>

        @if (data.descripcion) {
          <p class="cond-description">{{ data.descripcion }}</p>
        }
      </header>

      <div class="doc-card-body">
        <div class="doc-card-content">
          @if (data.sections.length === 0) {
            <div class="empty-sections">
              <p>Esta condición aún no tiene secciones redactadas.</p>
              <button class="empty-cta" type="button" (click)="editar.emit(data)">
                <span [innerHTML]="editSvg()"></span>
                <span>Comenzar a redactar</span>
              </button>
            </div>
          }
          @for (s of data.sections; track s.h) {
            <section class="doc-section">
              <h3 class="section-h">{{ s.h }}</h3>
              @if (s.contenido) {
                <p class="section-p">{{ s.contenido }}</p>
              } @else {
                <p class="section-empty">Sección sin contenido redactado todavía.</p>
              }
            </section>
          }
        </div>

        <div class="doc-card-aside">
          <app-attachment-panel
            [items]="data.anexos"
            [conditionNumber]="data.numero"
            (download)="onDownloadAnexo($event)"
            (upload)="onUploadAnexo($event)" />
        </div>
      </div>

      <footer class="doc-card-actions">
        <div class="actions-left">
          <button class="action-btn" type="button" (click)="editar.emit(data)">
            <span [innerHTML]="editSvg()"></span>
            <span>Editar texto</span>
          </button>
          <button class="action-btn" type="button" (click)="pedirIA.emit(data)">
            <span [innerHTML]="sparklesSvg()"></span>
            <span>Pedir asistencia IA</span>
          </button>
          <button class="action-btn" type="button" (click)="onAddAnexoClick()">
            <span [innerHTML]="uploadSvg()"></span>
            <span>Subir anexo</span>
          </button>
        </div>
        <div class="actions-right">
          @if (nextCondition) {
            <button class="action-next" type="button" (click)="goToNext.emit(data.numero)">
              <span>Siguiente: Condición {{ paddedNextNumero() }}</span>
              <span [innerHTML]="arrowSvg()"></span>
            </button>
          }
        </div>
      </footer>
    </article>
  `,
  styles: [`
    :host { display: block; }

    .doc-card {
      background: #fff;
      border-radius: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(15, 23, 42, 0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: box-shadow 0.25s ease, transform 0.25s ease;
    }
    .doc-card:hover {
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 14px 36px rgba(15, 23, 42, 0.08);
    }
    .doc-card-top {
      height: 4px;
      width: 100%;
      background: #006600;
    }

    .doc-card-head {
      padding: 1.75rem 2rem 1.25rem;
      border-bottom: 1px solid #eef2f7;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .cond-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      color: #006600;
    }
    .cond-title {
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      margin: 0;
      letter-spacing: -0.01em;
    }
    .cond-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 13px;
      color: #64748b;
    }
    .meta-sep { color: #cbd5e1; }
    .status-pill {
      padding: 3px 11px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .status-pill .dot { width: 6px; height: 6px; border-radius: 50%; }
    .status-complete { background: #e8f5e9; color: #006600; }
    .status-complete .dot { background: #006600; }
    .status-progress { background: #fff8e1; color: #b45309; }
    .status-progress .dot { background: #f59e0b; }
    .status-empty { background: #f1f5f9; color: #64748b; }
    .status-empty .dot { background: #94a3b8; }
    .cond-description {
      margin: 0;
      font-size: 14px;
      line-height: 1.55;
      color: #475569;
      max-width: 70ch;
    }

    .doc-card-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 280px;
      gap: 2rem;
      padding: 1.75rem 2rem 1.25rem;
    }

    .doc-card-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .doc-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .section-h {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #eef2f7;
      letter-spacing: -0.005em;
    }
    .section-p {
      font-size: 14.5px;
      line-height: 1.75;
      color: #1f2937;
      margin: 0;
      white-space: pre-wrap;
    }
    .section-empty {
      font-size: 13.5px;
      color: #94a3b8;
      font-style: italic;
      margin: 0;
    }

    .empty-sections {
      background: #f8fafc;
      border: 1.5px dashed #cbd5e1;
      border-radius: 0.85rem;
      padding: 1.75rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
      color: #64748b;
      font-size: 14px;
    }
    .empty-cta {
      border: none;
      background: #006600;
      color: #fff;
      padding: 0.55rem 1rem;
      border-radius: 0.55rem;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex; align-items: center; gap: 0.4rem;
      font-family: inherit;
    }
    .empty-cta:hover { background: #005c00; }
    .empty-cta ::ng-deep svg { width: 14px; height: 14px; }

    .doc-card-aside { min-width: 0; }

    .doc-card-actions {
      background: #f8fafc;
      border-top: 1px solid #eef2f7;
      padding: 0.85rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .actions-left, .actions-right { display: flex; gap: 0.25rem; flex-wrap: wrap; }
    .action-btn {
      border: none;
      background: transparent;
      color: #006600;
      font-weight: 600;
      font-size: 13px;
      padding: 0.45rem 0.7rem;
      border-radius: 0.4rem;
      cursor: pointer;
      display: inline-flex; align-items: center; gap: 0.4rem;
      transition: background 0.15s ease;
      font-family: inherit;
    }
    .action-btn:hover { background: #f0f8f0; }
    .action-btn ::ng-deep svg { width: 14px; height: 14px; }
    .action-next {
      border: 1px solid #006600;
      background: #fff;
      color: #006600;
      font-weight: 700;
      font-size: 13px;
      padding: 0.5rem 0.9rem;
      border-radius: 0.5rem;
      cursor: pointer;
      display: inline-flex; align-items: center; gap: 0.4rem;
      transition: background 0.15s ease, color 0.15s ease;
      font-family: inherit;
    }
    .action-next:hover { background: #006600; color: #fff; }
    .action-next ::ng-deep svg { width: 14px; height: 14px; }

    @media (max-width: 980px) {
      .doc-card-body { grid-template-columns: 1fr; }
      .doc-card-aside { order: 2; }
    }
    @media (max-width: 640px) {
      .doc-card-head { padding: 1.25rem 1.25rem 1rem; }
      .doc-card-body { padding: 1.25rem; gap: 1.25rem; }
      .doc-card-actions { padding: 0.85rem 1.25rem; }
      .cond-title { font-size: 22px; }
    }
  `]
})
export class ConditionDocumentCardComponent {
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) data!: CondicionDocumentVM;
  /** Next condition number, when one exists — used for the "Siguiente" button. */
  @Input() nextCondition: CondicionDocumentVM | null = null;

  @Output() editar = new EventEmitter<CondicionDocumentVM>();
  @Output() pedirIA = new EventEmitter<CondicionDocumentVM>();
  @Output() uploadAnexo = new EventEmitter<{ conditionNumber: number; file: File }>();
  @Output() downloadAnexo = new EventEmitter<{ conditionNumber: number; anexo: AnexoVM }>();
  @Output() goToNext = new EventEmitter<number>();
  @Output() requestAddAnexo = new EventEmitter<number>();

  cardDomId(): string {
    return `cond-${this.data.numero}`;
  }

  paddedNumero(): string {
    return String(this.data.numero).padStart(2, '0');
  }

  paddedNextNumero(): string {
    return String(this.nextCondition?.numero ?? 0).padStart(2, '0');
  }

  statusText(): string {
    return statusLabel(this.data.status);
  }

  onAddAnexoClick(): void {
    this.requestAddAnexo.emit(this.data.numero);
  }

  onUploadAnexo(ev: { conditionNumber: number; file: File }): void {
    this.uploadAnexo.emit(ev);
  }

  onDownloadAnexo(anexo: AnexoVM): void {
    this.downloadAnexo.emit({ conditionNumber: this.data.numero, anexo });
  }

  editSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`
    );
  }

  sparklesSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.7L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l6.1-1.3z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/></svg>`
    );
  }

  uploadSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`
    );
  }

  arrowSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`
    );
  }
}
