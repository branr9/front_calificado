import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { DocumentoBaseService } from '../../core/services/documento-base.service';
import {
  DocumentoBaseDTO,
  DocumentoBaseScope,
  SCOPE_DESCRIPTION,
  SCOPE_LABEL
} from '../../core/models/documento-base.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-marco-referencia-panel',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="marco" [class.expanded]="expanded()">
      <header class="marco-head" (click)="toggle()" role="button" tabindex="0"
              (keydown.enter)="toggle()" (keydown.space)="toggle(); $event.preventDefault()">
        <div class="head-left">
          <span class="head-icon" [innerHTML]="bookSvg()"></span>
          <div class="head-text">
            <div class="head-title">
              Marco de referencia
              <span class="head-count">·</span>
              <span class="head-count">{{ documentos().length }} documento{{ documentos().length === 1 ? '' : 's' }}</span>
            </div>
            <div class="head-sub">
              La IA usa estos PDFs como contexto en las 9 condiciones — se leen una vez, no por cada condición.
            </div>
          </div>
        </div>
        <div class="head-right">
          @if (canManage()) {
            <button class="head-cta" type="button" (click)="openUpload($event)">
              <span [innerHTML]="plusSvg()"></span>
              <span>Subir documento</span>
            </button>
          }
          <button class="head-toggle" type="button" [attr.aria-label]="expanded() ? 'Colapsar' : 'Expandir'">
            <span [innerHTML]="chevSvg()"></span>
          </button>
        </div>
      </header>

      @if (expanded()) {
        <div class="marco-body">
          @if (loading()) {
            <div class="marco-state">Cargando documentos…</div>
          } @else if (documentos().length === 0) {
            <div class="marco-empty">
              <div class="empty-title">Aún no hay marco normativo cargado</div>
              <p>
                Cuando subas documentos como el Decreto 1330 o el plan curricular del programa,
                la IA los usará automáticamente como contexto en cada análisis. No hace falta
                subirlos en cada condición — se indexan una vez.
              </p>
              @if (canManage()) {
                <button class="empty-cta" type="button" (click)="openUpload($event)">
                  <span [innerHTML]="plusSvg()"></span>
                  <span>Subir el primer documento</span>
                </button>
              }
            </div>
          } @else {
            <div class="docs-grid">
              @for (doc of documentos(); track doc.id) {
                <article class="doc-tile" [attr.data-scope]="doc.scope">
                  <div class="tile-top">
                    <span class="scope-pill" [attr.data-scope]="doc.scope">{{ scopeLabel(doc.scope) }}</span>
                    @if (canManage()) {
                      <button class="tile-delete" type="button"
                              [attr.aria-label]="'Eliminar ' + doc.nombre"
                              (click)="confirmDelete(doc)">
                        <span [innerHTML]="trashSvg()"></span>
                      </button>
                    }
                  </div>
                  <div class="tile-name" [title]="doc.nombre">{{ doc.nombre }}</div>
                  @if (doc.descripcion) {
                    <div class="tile-desc">{{ doc.descripcion }}</div>
                  }
                  <div class="tile-meta">
                    <span class="meta-piece">{{ humanSize(doc.tamanoBytes) }}</span>
                    <span class="meta-sep">·</span>
                    <span class="meta-piece">{{ formatDate(doc.fechaSubida) }}</span>
                    @if (doc.subidoPor) {
                      <span class="meta-sep">·</span>
                      <span class="meta-piece">{{ doc.subidoPor }}</span>
                    }
                  </div>
                  <div class="tile-actions">
                    @if (doc.indexado) {
                      <span class="index-pill ok">
                        <span class="dot"></span>Indexado
                      </span>
                    } @else {
                      <span class="index-pill pending">
                        <span class="dot"></span>Procesando
                      </span>
                    }
                    <button class="tile-download" type="button" (click)="download(doc)">
                      <span [innerHTML]="downloadSvg()"></span>
                      <span>Descargar</span>
                    </button>
                  </div>
                </article>
              }
            </div>
          }
        </div>
      }

      <!-- Upload modal -->
      @if (uploadOpen()) {
        <div class="modal-backdrop" (click)="closeUpload()"></div>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
          <header class="modal-head">
            <h3 id="upload-title">Subir documento de referencia</h3>
            <button class="modal-close" type="button" (click)="closeUpload()" aria-label="Cerrar">
              <span [innerHTML]="closeSvg()"></span>
            </button>
          </header>
          <div class="modal-body">
            <div class="field">
              <label>Alcance</label>
              <div class="scope-options">
                <label class="scope-opt" [class.selected]="form.scope === 'NACIONAL'">
                  <input type="radio" name="scope" value="NACIONAL" [(ngModel)]="form.scope" />
                  <div class="opt-text">
                    <span class="opt-title">Nacional</span>
                    <span class="opt-sub">{{ scopeDescription('NACIONAL') }}</span>
                  </div>
                </label>
                <label class="scope-opt"
                       [class.selected]="form.scope === 'PROGRAMA'"
                       [class.disabled]="programaId == null">
                  <input type="radio" name="scope" value="PROGRAMA"
                         [disabled]="programaId == null"
                         [(ngModel)]="form.scope" />
                  <div class="opt-text">
                    <span class="opt-title">Programa</span>
                    <span class="opt-sub">{{ scopeDescription('PROGRAMA') }}</span>
                  </div>
                </label>
              </div>
            </div>
            <div class="field">
              <label>Archivo PDF</label>
              <div class="file-row">
                <button class="file-btn" type="button" (click)="filePicker.click()">
                  <span [innerHTML]="paperclipSvg()"></span>
                  <span>{{ form.file ? 'Cambiar archivo' : 'Seleccionar PDF' }}</span>
                </button>
                <input #filePicker type="file" accept="application/pdf"
                       class="hidden-file" (change)="onFileChosen($event)" />
                @if (form.file) {
                  <span class="file-chosen">{{ form.file.name }} · {{ humanSize(form.file.size) }}</span>
                }
              </div>
            </div>
            <div class="field">
              <label>Descripción (opcional)</label>
              <textarea rows="2" [(ngModel)]="form.descripcion"
                        placeholder="P. ej. Decreto 1330 de 2019 — registro calificado"></textarea>
            </div>
            @if (uploadError()) {
              <div class="error-banner">{{ uploadError() }}</div>
            }
            @if (uploading()) {
              <div class="upload-progress">
                <div class="progress-bar"><div class="progress-fill"></div></div>
                <div class="progress-text">Indexando el documento en la IA… esto puede tardar entre 20 y 60 segundos.</div>
              </div>
            }
          </div>
          <footer class="modal-foot">
            <button class="btn-secondary" type="button" (click)="closeUpload()" [disabled]="uploading()">
              Cancelar
            </button>
            <button class="btn-primary" type="button"
                    (click)="submit()"
                    [disabled]="!canSubmit() || uploading()">
              {{ uploading() ? 'Procesando…' : 'Subir e indexar' }}
            </button>
          </footer>
        </div>
      }

      <!-- Delete confirm -->
      @if (toDelete()) {
        <div class="modal-backdrop" (click)="cancelDelete()"></div>
        <div class="modal modal-sm" role="alertdialog" aria-modal="true">
          <header class="modal-head">
            <h3>Eliminar documento</h3>
          </header>
          <div class="modal-body">
            <p>
              Vas a eliminar <strong>{{ toDelete()!.nombre }}</strong>. El documento se borrará del
              almacenamiento y de la base de conocimiento de la IA. La acción no se puede deshacer.
            </p>
            @if (deleteError()) {
              <div class="error-banner">{{ deleteError() }}</div>
            }
          </div>
          <footer class="modal-foot">
            <button class="btn-secondary" type="button" (click)="cancelDelete()" [disabled]="deleting()">
              Cancelar
            </button>
            <button class="btn-danger" type="button" (click)="doDelete()" [disabled]="deleting()">
              {{ deleting() ? 'Eliminando…' : 'Eliminar definitivamente' }}
            </button>
          </footer>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }

    .marco {
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 6px 18px rgba(15,23,42,0.04);
      overflow: hidden;
      transition: box-shadow 0.25s ease;
    }
    .marco.expanded { box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 12px 30px rgba(15,23,42,0.07); }

    .marco-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      cursor: pointer;
      gap: 1rem;
      flex-wrap: wrap;
      outline: none;
    }
    .marco-head:focus-visible { box-shadow: inset 0 0 0 2px #006600; border-radius: 1rem; }

    .head-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      min-width: 0;
      flex: 1;
    }
    .head-icon {
      width: 44px; height: 44px;
      border-radius: 0.6rem;
      background: linear-gradient(135deg, #006600 0%, #007b00 100%);
      color: #fff;
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .head-icon ::ng-deep svg { width: 22px; height: 22px; }
    .head-text { min-width: 0; }
    .head-title {
      font-size: 15.5px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.005em;
    }
    .head-count { color: #64748b; font-weight: 600; margin-left: 0.2rem; }
    .head-sub {
      font-size: 12.5px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.45;
    }

    .head-right { display: flex; align-items: center; gap: 0.5rem; }
    .head-cta {
      border: none;
      background: #006600;
      color: #fff;
      padding: 0.5rem 0.85rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 13px;
      display: inline-flex; align-items: center; gap: 0.4rem;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s ease;
    }
    .head-cta:hover { background: #005c00; }
    .head-cta ::ng-deep svg { width: 14px; height: 14px; }
    .head-toggle {
      border: 1px solid #e2e8f0;
      background: #fff;
      width: 32px; height: 32px;
      border-radius: 0.5rem;
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer;
      color: #64748b;
    }
    .head-toggle ::ng-deep svg {
      width: 14px; height: 14px;
      transition: transform 0.25s ease;
    }
    .marco.expanded .head-toggle ::ng-deep svg { transform: rotate(180deg); }

    .marco-body {
      border-top: 1px solid #eef2f7;
      padding: 1.25rem 1.5rem 1.5rem;
    }

    .marco-state {
      padding: 1.5rem;
      text-align: center;
      color: #64748b;
      font-size: 13.5px;
    }
    .marco-empty {
      background: #f8fafc;
      border: 1.5px dashed #cbd5e1;
      border-radius: 0.85rem;
      padding: 1.75rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      align-items: center;
      color: #64748b;
    }
    .empty-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .marco-empty p {
      margin: 0;
      font-size: 13.5px;
      line-height: 1.55;
      max-width: 60ch;
    }
    .empty-cta {
      border: none;
      background: #006600;
      color: #fff;
      padding: 0.55rem 1rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 13px;
      display: inline-flex; align-items: center; gap: 0.4rem;
      cursor: pointer;
      font-family: inherit;
      margin-top: 0.3rem;
    }
    .empty-cta:hover { background: #005c00; }
    .empty-cta ::ng-deep svg { width: 14px; height: 14px; }

    .docs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.85rem;
    }
    .doc-tile {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.9rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .doc-tile:hover { border-color: #006600; transform: translateY(-1px); }
    .tile-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .scope-pill {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      padding: 3px 9px;
      border-radius: 999px;
    }
    .scope-pill[data-scope="NACIONAL"] { background: #e8f5e9; color: #006600; }
    .scope-pill[data-scope="PROGRAMA"] { background: #e0ecff; color: #1d4ed8; }

    .tile-delete {
      border: none;
      background: transparent;
      color: #94a3b8;
      width: 28px; height: 28px;
      border-radius: 0.4rem;
      cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .tile-delete:hover { background: #fee2e2; color: #dc2626; }
    .tile-delete ::ng-deep svg { width: 14px; height: 14px; }

    .tile-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tile-desc {
      font-size: 12.5px;
      color: #475569;
      line-height: 1.45;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .tile-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      font-size: 11.5px;
      color: #94a3b8;
    }
    .meta-sep { color: #cbd5e1; }
    .tile-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 0.5rem;
      border-top: 1px solid #eef2f7;
    }
    .index-pill {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 999px;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .index-pill .dot { width: 5px; height: 5px; border-radius: 50%; }
    .index-pill.ok { background: #e8f5e9; color: #006600; }
    .index-pill.ok .dot { background: #006600; }
    .index-pill.pending { background: #fff8e1; color: #b45309; }
    .index-pill.pending .dot { background: #f59e0b; animation: pulse 1.6s ease-in-out infinite; }

    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }

    .tile-download {
      border: none;
      background: transparent;
      color: #006600;
      font-weight: 600;
      font-size: 12.5px;
      padding: 4px 8px;
      border-radius: 0.4rem;
      display: inline-flex; align-items: center; gap: 0.3rem;
      cursor: pointer;
      font-family: inherit;
    }
    .tile-download:hover { background: #f0f8f0; }
    .tile-download ::ng-deep svg { width: 13px; height: 13px; }

    /* ─── Modal ─── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(2px);
      z-index: 999;
    }
    .modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35);
      width: 92%;
      max-width: 540px;
      max-height: 92vh;
      overflow-y: auto;
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }
    .modal.modal-sm { max-width: 440px; }
    .modal-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.1rem 1.25rem 0.85rem;
      border-bottom: 1px solid #eef2f7;
    }
    .modal-head h3 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
    }
    .modal-close {
      border: none;
      background: transparent;
      color: #64748b;
      width: 30px; height: 30px;
      border-radius: 0.4rem;
      cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .modal-close:hover { background: #f1f5f9; color: #0f172a; }
    .modal-close ::ng-deep svg { width: 14px; height: 14px; }

    .modal-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .field { display: flex; flex-direction: column; gap: 0.45rem; }
    .field > label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #64748b;
    }

    .scope-options { display: flex; flex-direction: column; gap: 0.5rem; }
    .scope-opt {
      display: flex;
      gap: 0.7rem;
      align-items: flex-start;
      padding: 0.7rem 0.85rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.55rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .scope-opt:hover { border-color: #006600; }
    .scope-opt.selected { border-color: #006600; background: #f0f8f0; }
    .scope-opt.disabled { opacity: 0.55; cursor: not-allowed; }
    .scope-opt input[type="radio"] { margin-top: 0.2rem; accent-color: #006600; }
    .opt-text { display: flex; flex-direction: column; gap: 2px; }
    .opt-title { font-size: 14px; font-weight: 700; color: #0f172a; }
    .opt-sub { font-size: 12.5px; color: #64748b; line-height: 1.4; }

    .file-row {
      display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;
    }
    .file-btn {
      border: 1.5px dashed #006600;
      background: #f0f8f0;
      color: #006600;
      padding: 0.55rem 0.9rem;
      border-radius: 0.55rem;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex; align-items: center; gap: 0.4rem;
      font-family: inherit;
    }
    .file-btn:hover { background: #e6f1e6; }
    .file-btn ::ng-deep svg { width: 14px; height: 14px; }
    .file-chosen {
      font-size: 12.5px;
      color: #475569;
      font-weight: 500;
    }
    .hidden-file { display: none; }

    textarea {
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.55rem 0.7rem;
      font-size: 13.5px;
      font-family: inherit;
      resize: vertical;
      color: #1f2937;
    }
    textarea:focus { outline: none; border-color: #006600; box-shadow: 0 0 0 2px rgba(0,102,0,0.12); }

    .error-banner {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #991b1b;
      padding: 0.55rem 0.8rem;
      border-radius: 0.5rem;
      font-size: 12.5px;
    }

    .upload-progress {
      background: #f0f8f0;
      border: 1px solid #c8e6c9;
      border-radius: 0.55rem;
      padding: 0.65rem 0.85rem;
    }
    .progress-bar {
      height: 4px;
      background: #c8e6c9;
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, #006600, #007b00, #006600);
      background-size: 200% 100%;
      animation: shimmer 1.4s linear infinite;
      border-radius: 999px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; transform: translateX(-100%); }
      100% { background-position: 0 0; transform: translateX(250%); }
    }
    .progress-text {
      font-size: 12px;
      color: #006600;
      font-weight: 600;
      margin-top: 0.4rem;
    }

    .modal-foot {
      padding: 0.85rem 1.25rem 1rem;
      border-top: 1px solid #eef2f7;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .btn-primary, .btn-secondary, .btn-danger {
      border: none;
      padding: 0.55rem 1rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 13.5px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s ease;
    }
    .btn-primary { background: #006600; color: #fff; }
    .btn-primary:not([disabled]):hover { background: #005c00; }
    .btn-primary[disabled] { opacity: 0.55; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:not([disabled]):hover { background: #e2e8f0; }
    .btn-secondary[disabled] { opacity: 0.55; cursor: not-allowed; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:not([disabled]):hover { background: #b91c1c; }
    .btn-danger[disabled] { opacity: 0.55; cursor: not-allowed; }
  `]
})
export class MarcoReferenciaPanelComponent implements OnChanges {
  private docService = inject(DocumentoBaseService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  @Input() programaId: number | null = null;
  /** Emitted after upload/delete so the parent can refresh related state. */
  @Output() changed = new EventEmitter<void>();

  @ViewChild('filePicker') filePicker?: ElementRef<HTMLInputElement>;

  protected documentos = signal<DocumentoBaseDTO[]>([]);
  protected loading = signal<boolean>(false);
  protected expanded = signal<boolean>(false);

  protected uploadOpen = signal<boolean>(false);
  protected uploading = signal<boolean>(false);
  protected uploadError = signal<string | null>(null);

  protected toDelete = signal<DocumentoBaseDTO | null>(null);
  protected deleting = signal<boolean>(false);
  protected deleteError = signal<string | null>(null);

  protected form: { scope: DocumentoBaseScope; file: File | null; descripcion: string } = {
    scope: 'NACIONAL',
    file: null,
    descripcion: ''
  };

  protected canManage = computed(() => this.authService.hasRole('ADMINISTRADOR'));

  ngOnChanges(changes: SimpleChanges): void {
    if ('programaId' in changes) this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.docService.list(this.programaId)
      .pipe(catchError(() => of([] as DocumentoBaseDTO[])))
      .subscribe((docs) => {
        this.documentos.set(docs);
        this.loading.set(false);
      });
  }

  toggle(): void {
    const next = !this.expanded();
    this.expanded.set(next);
    if (next && this.documentos().length === 0 && !this.loading()) this.reload();
  }

  openUpload(ev?: Event): void {
    ev?.stopPropagation();
    this.form = {
      scope: this.programaId != null ? 'NACIONAL' : 'NACIONAL',
      file: null,
      descripcion: ''
    };
    this.uploadError.set(null);
    this.uploadOpen.set(true);
    this.expanded.set(true);
  }

  closeUpload(): void {
    if (this.uploading()) return;
    this.uploadOpen.set(false);
  }

  onFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      this.uploadError.set('Solo se aceptan archivos PDF.');
      input.value = '';
      return;
    }
    this.form.file = file;
    this.uploadError.set(null);
  }

  canSubmit(): boolean {
    if (!this.form.file) return false;
    if (this.form.scope === 'PROGRAMA' && this.programaId == null) return false;
    return true;
  }

  submit(): void {
    if (!this.canSubmit() || this.uploading()) return;
    this.uploading.set(true);
    this.uploadError.set(null);

    this.docService.upload({
      file: this.form.file!,
      scope: this.form.scope,
      programaId: this.form.scope === 'PROGRAMA' ? this.programaId : null,
      descripcion: this.form.descripcion || null
    }).subscribe({
      next: () => {
        this.uploading.set(false);
        this.uploadOpen.set(false);
        this.reload();
        this.changed.emit();
      },
      error: (err: HttpErrorResponse | unknown) => {
        this.uploading.set(false);
        this.uploadError.set(this.describeError(err));
      }
    });
  }

  confirmDelete(doc: DocumentoBaseDTO): void {
    this.deleteError.set(null);
    this.toDelete.set(doc);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.toDelete.set(null);
  }

  doDelete(): void {
    const doc = this.toDelete();
    if (!doc || this.deleting()) return;
    this.deleting.set(true);
    this.docService.delete(doc.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toDelete.set(null);
        this.reload();
        this.changed.emit();
      },
      error: (err: HttpErrorResponse | unknown) => {
        this.deleting.set(false);
        this.deleteError.set(this.describeError(err));
      }
    });
  }

  download(doc: DocumentoBaseDTO): void {
    this.docService.download(doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.nombre;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: () => console.error('No se pudo descargar el documento.')
    });
  }

  scopeLabel(scope: DocumentoBaseScope): string {
    return SCOPE_LABEL[scope];
  }

  scopeDescription(scope: DocumentoBaseScope): string {
    return SCOPE_DESCRIPTION[scope];
  }

  humanSize(bytes: number): string {
    if (!bytes || bytes <= 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('es-CO', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch {
      return '—';
    }
  }

  private describeError(err: HttpErrorResponse | unknown): string {
    if (err instanceof HttpErrorResponse) {
      const detail = typeof err.error === 'object' && err.error !== null && 'message' in err.error
        ? String((err.error as { message?: string }).message ?? '')
        : typeof err.error === 'string' ? err.error : '';
      if (err.status === 0) return 'No se pudo contactar el servidor.';
      if (err.status === 401 || err.status === 403) return 'No tienes permisos para esta acción.';
      if (err.status === 413) return 'El archivo es demasiado grande.';
      if (err.status === 422) return detail || 'El archivo no pudo procesarse en la IA.';
      if (err.status === 503) return 'El servicio de IA no está disponible. Reintenta más tarde.';
      return detail || `Error ${err.status}.`;
    }
    return 'Ocurrió un error inesperado.';
  }

  // ─── SVG helpers ───────────────────────────────────────────────────────
  bookSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
    );
  }
  plusSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
    );
  }
  chevSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`
    );
  }
  closeSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
    );
  }
  downloadSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`
    );
  }
  trashSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>`
    );
  }
  paperclipSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`
    );
  }
}
