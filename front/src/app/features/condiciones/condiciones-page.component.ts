import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  Subject,
  Subscription,
  catchError,
  forkJoin,
  interval,
  map,
  of,
  takeUntil
} from 'rxjs';

import { ProgramaService } from '../../core/services/programa.service';
import { LineamientoService } from '../../core/services/lineamiento.service';
import { SeccionService } from '../../core/services/seccion.service';
import { EvidenciaService } from '../../core/services/evidencia.service';
import { RevisionGeneralService } from '../../core/services/revision-general.service';
import { ProgramaDTO } from '../../core/models/programa.model';
import { LineamientoDTO } from '../../core/models/lineamiento.model';
import { SeccionDTO } from '../../core/models/seccion.model';
import { EvidenciaDTO } from '../../core/models/evidencia.model';
import {
  AnexoVM,
  CONDICION_3_SUBCOMPONENTES,
  CONDICION_COLORS,
  CondicionDocumentVM,
  CondicionesGlobalStats,
  anexoTypeFromMime,
  countWords,
  humanFileSize,
  relativeOrAbsoluteDate,
  statusFromPorcentaje
} from '../../core/models/condicion.model';
import {
  RevisionGeneralDetailDTO,
  RevisionGeneralJobDTO
} from '../../core/models/revision-general.model';

import { ConditionDocumentCardComponent } from './condition-document-card.component';
import { ConditionIndexSidebarComponent } from './condition-index-sidebar.component';
import { MarcoReferenciaPanelComponent } from './marco-referencia-panel.component';
import { RevisionGeneralPanelComponent } from './revision-general-panel.component';
import { RevisionHistorialComponent } from './revision-historial.component';

interface CondicionData {
  lineamiento: LineamientoDTO;
  secciones: SeccionDTO[];
  evidencias: EvidenciaDTO[];
}

@Component({
  selector: 'app-condiciones-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    ConditionDocumentCardComponent,
    ConditionIndexSidebarComponent,
    MarcoReferenciaPanelComponent,
    RevisionGeneralPanelComponent,
    RevisionHistorialComponent
  ],
  template: `
    <div class="page">
      <!-- ───────── Header documental ───────── -->
      <header class="doc-hero">
        <div class="doc-hero-inner">
          <div class="hero-top">
            <div class="hero-text">
              <div class="hero-eyebrow">DOCUMENTO DE REGISTRO CALIFICADO · DECRETO 1330 DE 2019</div>
              <h1 class="hero-title">{{ programaSeleccionado()?.nombre || 'Selecciona un programa' }}</h1>
              <div class="hero-meta">
                Unidad Central del Valle del Cauca · Tuluá, Colombia
                @if (programaSeleccionado(); as p) {
                  · {{ p.nivel }} · {{ p.modalidad }}
                  @if (p.codigoSnies) { · SNIES {{ p.codigoSnies }} }
                }
                · {{ fechaActualHumana() }}
              </div>
            </div>
            <div class="hero-actions">
              <button
                class="btn btn-revision"
                type="button"
                (click)="onRevisionGeneral()"
                [disabled]="!programaSeleccionado() || revisionLoading()"
                [title]="!programaSeleccionado() ? 'Selecciona un programa primero' : 'Revisión completa con IA'">
                <span [innerHTML]="sparklesSvg()"></span>
                <span>{{ revisionLoading() ? 'Analizando…' : 'Revisión general' }}</span>
              </button>
              <button class="btn btn-outline-white" type="button" (click)="onExportarZip()" [disabled]="!programaSeleccionado()">
                <span [innerHTML]="downloadSvg()"></span>
                <span>Exportar ZIP</span>
              </button>
            </div>
          </div>

          <div class="hero-selector">
            <label for="programa-select" class="selector-label">Programa en revisión</label>
            <select
              id="programa-select"
              class="programa-select"
              [value]="programaSeleccionadoId() ?? ''"
              (change)="onSeleccionarPrograma($event)"
              [disabled]="programas().length === 0">
              @if (programas().length === 0) {
                <option value="">— Sin programas —</option>
              }
              @for (p of programas(); track p.id) {
                <option [value]="p.id">{{ p.nombre }}</option>
              }
            </select>
          </div>

          <div class="hero-metrics">
            <div class="metric-tile">
              <div class="metric-value">{{ stats().palabras | number }}</div>
              <div class="metric-label">Palabras</div>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-tile">
              <div class="metric-value">{{ stats().totalAnexos | number }}</div>
              <div class="metric-label">Anexos</div>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-tile">
              <div class="metric-value">{{ stats().condicionesCompletas }}/{{ stats().totalCondiciones || 9 }}</div>
              <div class="metric-label">Condiciones completas</div>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-tile">
              <div class="metric-value">{{ stats().pct }}%</div>
              <div class="metric-label">Progreso global</div>
            </div>
          </div>
        </div>
      </header>

      <!-- ───────── Marco de referencia (documentos cross-condición) ───────── -->
      <div class="marco-wrap">
        <app-marco-referencia-panel
          [programaId]="programaSeleccionadoId()"
          (changed)="onMarcoChanged()" />
      </div>

      <!-- ───────── Body con dos columnas ───────── -->
      <div class="doc-body">
        <main class="doc-main">
          @if (condicionesLoading()) {
            <div class="loading-card">Cargando condiciones del programa…</div>
          }

          @if (!condicionesLoading() && condiciones().length === 0) {
            <div class="empty-card">
              <h3>Este programa aún no tiene condiciones registradas.</h3>
              <p>
                Cuando se creen los 9 lineamientos del Decreto 1330 de 2019 para
                este programa, aparecerán aquí con su contenido, anexos y
                avance.
              </p>
            </div>
          }

          @for (cond of condiciones(); track cond.numero; let i = $index) {
            <app-condition-document-card
              [data]="cond"
              [nextCondition]="nextCondition(i)"
              (editar)="onEditarCondicion($event)"
              (pedirIA)="onPedirIA($event)"
              (uploadAnexo)="onUploadAnexo($event)"
              (downloadAnexo)="onDownloadAnexo($event)"
              (requestAddAnexo)="onRequestAddAnexo($event)"
              (goToNext)="onGoToNext($event)" />
          }

          @if (programaSeleccionado()) {
            <section class="history-section">
              <app-revision-historial
                [items]="revisionHistory()"
                [loading]="historyLoading()"
                (select)="onHistoryItemSelected($event)"
                (refresh)="reloadHistory()" />
            </section>
          }
        </main>

        <aside class="doc-sidebar">
          <app-condition-index-sidebar
            [items]="condiciones()"
            [activeNumero]="activeNumero()"
            [totalPalabras]="stats().palabras"
            [totalAnexos]="stats().totalAnexos"
            [progresoGlobal]="stats().pct"
            (select)="onSelectIndex($event)" />
        </aside>
      </div>
    </div>

    <app-revision-general-panel
      [open]="revisionPanelOpen()"
      [loading]="revisionLoading()"
      [error]="revisionError()"
      [result]="revisionResult()"
      [programaNombre]="programaSeleccionado()?.nombre || null"
      [loadingTitle]="revisionLoadingTitle()"
      [elapsedSeconds]="revisionElapsedSeconds()"
      (close)="onRevisionPanelClose()"
      (retry)="onRevisionGeneral()" />
  `,
  styles: [`
    :host {
      display: block;
      background: #f0f3f8;
      min-height: 100vh;
    }
    .page { display: flex; flex-direction: column; }

    /* ───────── Hero documental ───────── */
    .doc-hero {
      background:
        linear-gradient(135deg, #004d00 0%, #006600 45%, #007b00 100%);
      color: #fff;
      padding: 2.75rem 3rem 2.5rem;
      position: relative;
      overflow: hidden;
    }
    .doc-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 85% 20%, rgba(255,255,255,0.12) 0%, transparent 60%),
        radial-gradient(circle at 5% 85%, rgba(255,255,255,0.08) 0%, transparent 50%);
      pointer-events: none;
    }
    .doc-hero-inner {
      max-width: 1400px;
      margin: 0 auto;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .hero-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .hero-text { max-width: 760px; }
    .hero-eyebrow {
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 1.6px;
      text-transform: uppercase;
      opacity: 0.85;
      margin-bottom: 0.65rem;
    }
    .hero-title {
      font-size: 38px;
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: -0.015em;
      margin: 0 0 0.55rem;
      color: #fff;
    }
    .hero-meta {
      font-size: 14px;
      opacity: 0.92;
      line-height: 1.55;
    }
    .hero-actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .btn {
      padding: 0.7rem 1.2rem;
      border: none;
      border-radius: 0.55rem;
      font-weight: 600;
      font-size: 14px;
      display: inline-flex; align-items: center; gap: 0.5rem;
      transition: all 0.25s ease;
      white-space: nowrap;
      cursor: pointer;
      font-family: inherit;
    }
    .btn[disabled] { opacity: 0.55; cursor: not-allowed; }
    .btn ::ng-deep svg { width: 16px; height: 16px; }
    .btn-revision {
      background: #fff;
      color: #006600;
      font-weight: 700;
      box-shadow: 0 6px 18px rgba(0,0,0,0.18);
    }
    .btn-revision:not([disabled]):hover {
      background: #f0f8f0;
      transform: translateY(-1px);
      box-shadow: 0 10px 24px rgba(0,0,0,0.22);
    }
    .btn-outline-white {
      background: rgba(255,255,255,0.12);
      color: #fff;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.28);
    }
    .btn-outline-white:not([disabled]):hover {
      background: rgba(255,255,255,0.22);
      transform: translateY(-1px);
    }

    .hero-selector {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;
    }
    .selector-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.3px;
      text-transform: uppercase;
      opacity: 0.85;
    }
    .programa-select {
      min-width: 280px;
      padding: 0.55rem 0.9rem;
      border-radius: 0.5rem;
      border: 1px solid rgba(255,255,255,0.3);
      background: rgba(255,255,255,0.12);
      color: #fff;
      font-size: 14px;
      font-family: inherit;
      backdrop-filter: blur(10px);
      cursor: pointer;
    }
    .programa-select option { color: #0f172a; }
    .programa-select:focus {
      outline: none;
      background: rgba(255,255,255,0.22);
      border-color: rgba(255,255,255,0.55);
    }
    .programa-select[disabled] { opacity: 0.6; cursor: not-allowed; }

    .hero-metrics {
      display: flex;
      align-items: stretch;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255,255,255,0.18);
      flex-wrap: wrap;
    }
    .metric-tile {
      flex: 1;
      min-width: 130px;
      padding: 0.5rem 0.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .metric-value {
      font-size: 30px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.01em;
    }
    .metric-label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 1.3px;
      text-transform: uppercase;
      opacity: 0.85;
    }
    .metric-divider {
      width: 1px;
      background: rgba(255,255,255,0.18);
      align-self: stretch;
    }

    /* ───────── Marco de referencia ───────── */
    .marco-wrap {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem 3rem 0;
      width: 100%;
    }
    @media (max-width: 768px) {
      .marco-wrap { padding: 1.25rem 1.25rem 0; }
    }

    /* ───────── Body ───────── */
    .doc-body {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem 3rem 4rem;
      width: 100%;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 2rem;
      align-items: start;
    }
    .doc-main {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-width: 0;
    }
    .doc-sidebar { min-width: 0; }

    .loading-card, .empty-card {
      background: #fff;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      text-align: center;
      color: #475569;
    }
    .empty-card h3 {
      margin: 0 0 0.5rem;
      color: #0f172a;
      font-size: 18px;
      font-weight: 700;
    }
    .empty-card p {
      margin: 0;
      font-size: 14px;
      line-height: 1.55;
      color: #64748b;
      max-width: 50ch;
      margin-inline: auto;
    }

    .history-section { margin-top: 1rem; }

    @media (max-width: 1100px) {
      .doc-body {
        grid-template-columns: 1fr;
      }
      .doc-sidebar {
        order: -1;
      }
    }
    @media (max-width: 768px) {
      .doc-hero { padding: 1.75rem 1.25rem; }
      .doc-body { padding: 1.25rem; }
      .hero-title { font-size: 28px; }
      .hero-actions { width: 100%; }
      .programa-select { min-width: 0; width: 100%; }
      .metric-divider { display: none; }
      .metric-tile { flex-basis: 45%; min-width: 0; }
    }
  `]
})
export class CondicionesPageComponent implements OnInit, OnDestroy, AfterViewInit {
  private programaService = inject(ProgramaService);
  private lineamientoService = inject(LineamientoService);
  private seccionService = inject(SeccionService);
  private evidenciaService = inject(EvidenciaService);
  private revisionGeneralService = inject(RevisionGeneralService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);

  protected programas = signal<ProgramaDTO[]>([]);
  protected programaSeleccionadoId = signal<number | null>(null);
  protected condicionData = signal<CondicionData[]>([]);
  protected condicionesLoading = signal<boolean>(false);
  /** Active condition (driven by scroll-spy). */
  protected activeNumero = signal<number | null>(null);

  // Revisión general (AI) state.
  protected revisionPanelOpen = signal<boolean>(false);
  protected revisionLoading = signal<boolean>(false);
  protected revisionError = signal<string | null>(null);
  protected revisionResult = signal<RevisionGeneralDetailDTO | null>(null);
  protected revisionLoadingTitle = signal<string | null>(null);
  protected revisionElapsedSeconds = signal<number | null>(null);
  protected revisionHistory = signal<RevisionGeneralJobDTO[]>([]);
  protected historyLoading = signal<boolean>(false);

  private pollSub: Subscription | null = null;
  private elapsedSub: Subscription | null = null;
  private activeRequestId: string | null = null;
  private jobStartedAt: number | null = null;
  private readonly destroy$ = new Subject<void>();

  /** Scroll-spy observer over the doc-card elements. */
  private cardObserver: IntersectionObserver | null = null;

  /** A fresh per-load token used to ignore stale in-flight responses. */
  private currentLoadToken = 0;

  /** Hidden input for "Subir anexo" triggered from a card's action bar. */
  private fileInputEl: HTMLInputElement | null = null;
  private uploadCondicionNumero: number | null = null;

  protected programaSeleccionado = computed<ProgramaDTO | null>(() => {
    const id = this.programaSeleccionadoId();
    if (id == null) return null;
    return this.programas().find((p) => p.id === id) ?? null;
  });

  /** All condition cards rendered in the main column (and consumed by the sidebar). */
  protected condiciones = computed<CondicionDocumentVM[]>(() => {
    return this.condicionData().map((d) => this.toDocumentVM(d));
  });

  protected stats = computed<CondicionesGlobalStats>(() => {
    const conds = this.condiciones();
    const programa = this.programaSeleccionado();
    const totalCondiciones = conds.length;
    const condicionesCompletas = conds.filter(c => c.status === 'complete').length;
    const palabras = conds.reduce((s, c) => s + c.palabras, 0);
    const totalAnexos = conds.reduce((s, c) => s + c.anexos.length, 0);
    const pct = totalCondiciones === 0
      ? 0
      : Math.round(conds.reduce((s, c) => s + c.pct, 0) / totalCondiciones);
    return {
      pct,
      programa: programa?.nombre || 'Selecciona un programa',
      palabras,
      totalAnexos,
      condicionesCompletas,
      totalCondiciones
    };
  });

  protected fechaActualHumana(): string {
    return new Date().toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  protected nextCondition(idx: number): CondicionDocumentVM | null {
    const list = this.condiciones();
    return idx >= 0 && idx + 1 < list.length ? list[idx + 1] : null;
  }

  ngOnInit(): void {
    this.cargarProgramas();
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.cardObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const numero = Number((visible[0].target as HTMLElement).dataset['numero']);
          if (!Number.isNaN(numero)) this.activeNumero.set(numero);
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    // Observe whenever cards re-render. A small interval-based re-sync keeps
    // this honest without depending on Angular lifecycle internals.
    interval(700).pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshObserver());
  }

  private refreshObserver(): void {
    if (!this.cardObserver) return;
    this.cardObserver.disconnect();
    document.querySelectorAll<HTMLElement>('app-condition-document-card .doc-card')
      .forEach((el) => this.cardObserver!.observe(el));
  }

  private cargarProgramas(): void {
    this.programaService.getProgramas().pipe(
      catchError(() => of([] as ProgramaDTO[]))
    ).subscribe((programas) => {
      this.programas.set(programas);
      if (programas.length > 0) {
        const primero = programas[0];
        this.programaSeleccionadoId.set(primero.id);
        this.cargarDatosPrograma(primero.id);
      } else {
        this.programaSeleccionadoId.set(null);
        this.condicionData.set([]);
        this.revisionHistory.set([]);
      }
    });
  }

  private cargarDatosPrograma(programaId: number): void {
    const myToken = ++this.currentLoadToken;
    this.condicionesLoading.set(true);
    this.condicionData.set([]);
    this.activeNumero.set(null);

    this.lineamientoService.getLineamientos(programaId).pipe(
      catchError(() => of([] as LineamientoDTO[]))
    ).subscribe((lineamientos) => {
      if (myToken !== this.currentLoadToken) return;

      if (lineamientos.length === 0) {
        this.condicionData.set([]);
        this.condicionesLoading.set(false);
        return;
      }

      const requests = lineamientos.map((lin) => this.loadCondicionData(lin));
      forkJoin(requests).subscribe({
        next: (data) => {
          if (myToken !== this.currentLoadToken) return;
          data.sort((a, b) => a.lineamiento.numero - b.lineamiento.numero);
          this.condicionData.set(data);
          this.condicionesLoading.set(false);
          if (data.length > 0) this.activeNumero.set(data[0].lineamiento.numero);
        },
        error: () => {
          if (myToken !== this.currentLoadToken) return;
          this.condicionData.set([]);
          this.condicionesLoading.set(false);
        }
      });
    });

    this.reloadHistory(programaId);
  }

  private loadCondicionData(lin: LineamientoDTO): Observable<CondicionData> {
    return forkJoin({
      secciones: this.seccionService.getByLineamiento(lin.id).pipe(
        catchError(() => of([] as SeccionDTO[]))
      ),
      evidencias: this.evidenciaService.getEvidenciasByLineamiento(lin.id).pipe(
        catchError(() => of([] as EvidenciaDTO[]))
      )
    }).pipe(map(({ secciones, evidencias }) => ({ lineamiento: lin, secciones, evidencias })));
  }

  private toDocumentVM(d: CondicionData): CondicionDocumentVM {
    const { lineamiento, secciones, evidencias } = d;
    const pct = lineamiento.porcentaje ?? 0;
    const palabras = secciones.reduce((s, sec) => s + countWords(sec.contenidoRedactado), 0);
    const anexos: AnexoVM[] = evidencias.map(ev => ({
      id: ev.id,
      name: ev.nombreArchivoOriginal,
      size: humanFileSize(ev.tamanoBytes),
      type: anexoTypeFromMime(ev.tipoMime, ev.nombreArchivoOriginal),
      updated: this.formatShortDate(ev.fechaSubida)
    }));
    // Last update = most recent evidencia upload, since per-section updatedAt
    // isn't exposed by the backend.
    const lastEvidencia = evidencias.reduce<string | null>((acc, ev) => {
      if (!ev.fechaSubida) return acc;
      if (!acc) return ev.fechaSubida;
      return new Date(ev.fechaSubida).getTime() > new Date(acc).getTime() ? ev.fechaSubida : acc;
    }, null);
    return {
      numero: lineamiento.numero,
      nombre: lineamiento.nombre,
      descripcion: lineamiento.descripcion || '',
      color: CONDICION_COLORS[lineamiento.numero] ?? '#006600',
      status: statusFromPorcentaje(pct),
      pct,
      palabras,
      ultimaActualizacion: relativeOrAbsoluteDate(lastEvidencia),
      sections: secciones.map(s => ({
        h: s.codigoSeccion,
        contenido: s.contenidoRedactado ?? ''
      })),
      anexos,
      subcomponentes: lineamiento.numero === 3 ? CONDICION_3_SUBCOMPONENTES : undefined,
      lineamientoId: lineamiento.id
    };
  }

  private formatShortDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  }

  reloadHistory(programaIdOverride?: number): void {
    const programaId = programaIdOverride ?? this.programaSeleccionadoId();
    if (programaId == null) {
      this.revisionHistory.set([]);
      return;
    }
    this.historyLoading.set(true);
    this.revisionGeneralService.listByPrograma(programaId).pipe(
      catchError(() => of([] as RevisionGeneralJobDTO[]))
    ).subscribe((items) => {
      this.revisionHistory.set(items);
      this.historyLoading.set(false);
    });
  }

  /**
   * Called after the marco-referencia panel uploads or deletes a document.
   * The marco itself reloads internally; the page only needs to refresh
   * subsequent revisión-general history (so the user notices the new context
   * if they had a prior empty result).
   */
  onMarcoChanged(): void {
    this.reloadHistory();
  }

  onSeleccionarPrograma(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);
    if (!Number.isNaN(id) && id > 0) {
      this.programaSeleccionadoId.set(id);
      this.cargarDatosPrograma(id);
    }
  }

  onSelectIndex(item: CondicionDocumentVM): void {
    this.activeNumero.set(item.numero);
    const el = document.getElementById(`cond-${item.numero}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onEditarCondicion(cond: CondicionDocumentVM): void {
    const programaId = this.programaSeleccionadoId();
    if (!programaId) return;
    this.router.navigate(['/programas', programaId, 'lineamiento', cond.numero]);
  }

  onPedirIA(cond: CondicionDocumentVM): void {
    // The lineamiento-detail view already exposes the per-section AI assistance.
    this.onEditarCondicion(cond);
  }

  onGoToNext(currentNumero: number): void {
    const list = this.condiciones();
    const idx = list.findIndex(c => c.numero === currentNumero);
    if (idx < 0 || idx + 1 >= list.length) return;
    this.onSelectIndex(list[idx + 1]);
  }

  onRequestAddAnexo(numero: number): void {
    // The action-bar button uses the page-level hidden input so we don't need
    // a second file picker UI inside each card.
    this.uploadCondicionNumero = numero;
    this.ensureFileInput();
    this.fileInputEl?.click();
  }

  onUploadAnexo(ev: { conditionNumber: number; file: File }): void {
    this.uploadFile(ev.conditionNumber, ev.file);
  }

  onDownloadAnexo(ev: { conditionNumber: number; anexo: AnexoVM }): void {
    this.evidenciaService.downloadEvidencia(ev.anexo.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ev.anexo.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: () => console.error('No se pudo descargar el anexo.')
    });
  }

  private ensureFileInput(): void {
    if (this.fileInputEl) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      const numero = this.uploadCondicionNumero;
      input.value = '';
      if (!file || numero == null) return;
      this.uploadFile(numero, file);
    });
    document.body.appendChild(input);
    this.fileInputEl = input;
  }

  private uploadFile(conditionNumero: number, file: File): void {
    const cond = this.condiciones().find(c => c.numero === conditionNumero);
    if (!cond) return;
    this.evidenciaService.uploadEvidencia(cond.lineamientoId, file).subscribe({
      next: () => {
        const programaId = this.programaSeleccionadoId();
        if (programaId != null) this.cargarDatosPrograma(programaId);
      },
      error: () => console.error('No se pudo subir el anexo.')
    });
  }

  onExportarZip(): void {
    const programa = this.programaSeleccionado();
    if (!programa) return;
    this.programaService.exportarZip(programa.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registro-calificado-${programa.nombre.replace(/\s+/g, '_')}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: () => console.error('No se pudo exportar el documento ZIP.')
    });
  }

  // ───────── Revisión general (async + polling) ─────────
  onRevisionGeneral(): void {
    const programa = this.programaSeleccionado();
    if (!programa || this.revisionLoading()) return;

    this.resetRevisionState();
    this.revisionPanelOpen.set(true);
    this.revisionLoading.set(true);
    this.revisionLoadingTitle.set('Encolando la revisión…');

    this.revisionGeneralService.startJob(programa.id).subscribe({
      next: (job) => {
        this.activeRequestId = job.requestId;
        this.startElapsedTicker();
        this.revisionLoadingTitle.set('Analizando el documento…');
        this.startPolling(job.requestId);
        this.reloadHistory();
      },
      error: (err: HttpErrorResponse | unknown) => {
        this.stopElapsedTicker();
        this.revisionLoading.set(false);
        this.revisionError.set(this.describeRevisionError(err));
      }
    });
  }

  onRevisionPanelClose(): void {
    this.stopPolling();
    this.stopElapsedTicker();
    this.revisionLoading.set(false);
    this.revisionPanelOpen.set(false);
    this.reloadHistory();
  }

  onHistoryItemSelected(item: RevisionGeneralJobDTO): void {
    if (item.status === 'PENDING' || item.status === 'RUNNING') {
      this.resetRevisionState();
      this.activeRequestId = item.requestId;
      this.revisionPanelOpen.set(true);
      this.revisionLoading.set(true);
      this.revisionLoadingTitle.set('Reanudando seguimiento…');
      this.jobStartedAt = item.startedAt ? new Date(item.startedAt).getTime() : Date.now();
      this.startElapsedTicker();
      this.startPolling(item.requestId);
      return;
    }

    if (item.status === 'FAILED') {
      this.resetRevisionState();
      this.revisionPanelOpen.set(true);
      this.revisionError.set(item.errorMessage || 'Esta revisión falló al ejecutarse.');
      return;
    }

    this.resetRevisionState();
    this.revisionPanelOpen.set(true);
    this.revisionLoading.set(true);
    this.revisionLoadingTitle.set('Cargando revisión guardada…');

    this.revisionGeneralService.getDetail(item.requestId).subscribe({
      next: (detail) => {
        this.revisionResult.set(detail);
        this.revisionLoading.set(false);
        this.revisionLoadingTitle.set(null);
      },
      error: (err: HttpErrorResponse | unknown) => {
        this.revisionLoading.set(false);
        this.revisionError.set(this.describeRevisionError(err));
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.stopElapsedTicker();
    this.cardObserver?.disconnect();
    if (this.fileInputEl) {
      this.fileInputEl.remove();
      this.fileInputEl = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ───────── helpers ─────────

  private resetRevisionState(): void {
    this.stopPolling();
    this.stopElapsedTicker();
    this.activeRequestId = null;
    this.revisionError.set(null);
    this.revisionResult.set(null);
    this.revisionElapsedSeconds.set(null);
    this.revisionLoadingTitle.set(null);
    this.jobStartedAt = null;
  }

  private startPolling(requestId: string): void {
    this.stopPolling();
    this.pollSub = this.revisionGeneralService
      .pollJob(requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (job) => {
          if (job.status === 'PENDING') {
            this.revisionLoadingTitle.set('En cola — esperando un worker disponible…');
          } else if (job.status === 'RUNNING') {
            this.revisionLoadingTitle.set('Analizando el documento…');
            if (this.jobStartedAt === null && job.startedAt) {
              this.jobStartedAt = new Date(job.startedAt).getTime();
            }
          } else if (job.status === 'COMPLETED') {
            this.fetchCompletedDetail(requestId);
          } else if (job.status === 'FAILED') {
            this.stopElapsedTicker();
            this.revisionLoading.set(false);
            this.revisionError.set(job.errorMessage || 'La revisión falló durante su ejecución.');
            this.reloadHistory();
          }
        },
        error: (err) => {
          this.stopElapsedTicker();
          this.revisionLoading.set(false);
          this.revisionError.set(this.describeRevisionError(err));
        }
      });
  }

  private stopPolling(): void {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = null;
    }
  }

  private fetchCompletedDetail(requestId: string): void {
    this.revisionLoadingTitle.set('Cargando resultados…');
    this.revisionGeneralService.getDetail(requestId).subscribe({
      next: (detail) => {
        this.revisionResult.set(detail);
        this.revisionLoading.set(false);
        this.revisionLoadingTitle.set(null);
        this.stopElapsedTicker();
        this.reloadHistory();
        if (detail.programaId != null) this.cargarDatosPrograma(detail.programaId);
      },
      error: (err: HttpErrorResponse | unknown) => {
        this.stopElapsedTicker();
        this.revisionLoading.set(false);
        this.revisionError.set(this.describeRevisionError(err));
      }
    });
  }

  private startElapsedTicker(): void {
    this.stopElapsedTicker();
    if (this.jobStartedAt === null) this.jobStartedAt = Date.now();
    this.revisionElapsedSeconds.set(0);
    this.elapsedSub = interval(1000).subscribe(() => {
      if (this.jobStartedAt === null) return;
      const seconds = Math.floor((Date.now() - this.jobStartedAt) / 1000);
      this.revisionElapsedSeconds.set(seconds);
    });
  }

  private stopElapsedTicker(): void {
    if (this.elapsedSub) {
      this.elapsedSub.unsubscribe();
      this.elapsedSub = null;
    }
  }

  private describeRevisionError(err: HttpErrorResponse | unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'No se pudo contactar el servidor. Verifica tu conexión y reintenta.';
      const detail =
        typeof err.error === 'object' && err.error !== null && 'message' in err.error
          ? String((err.error as { message?: string }).message ?? '')
          : typeof err.error === 'string'
            ? err.error
            : '';
      if (err.status === 503) return detail || 'El servicio de IA no está disponible temporalmente. Reintenta en unos minutos.';
      if (err.status === 422) return detail || 'La solicitud no se pudo procesar con la información disponible.';
      if (err.status === 404) return 'El programa no existe o no tiene condiciones registradas.';
      return detail || `Error ${err.status} al ejecutar la revisión general.`;
    }
    return 'Ocurrió un error inesperado al ejecutar la revisión general.';
  }

  sparklesSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.7L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l6.1-1.3z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/></svg>`
    );
  }

  downloadSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`
    );
  }
}
