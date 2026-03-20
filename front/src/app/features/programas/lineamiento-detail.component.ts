import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProgramaService } from '../../core/services/programa.service';
import { EvidenciaService } from '../../core/services/evidencia.service';
import { DocumentoBaseService } from '../../core/services/documento-base.service';
import { LineamientoService } from '../../core/services/lineamiento.service';
import { ProgramaDTO } from '../../core/models/programa.model';
import { EvidenciaDTO } from '../../core/models/evidencia.model';
import { DocumentoBaseDTO, TipoDocumentoBase } from '../../core/models/evidencia.model';
import { LineamientoDTO, LINEAMIENTOS_DECRETO_1330 } from '../../core/models/lineamiento.model';

@Component({
  selector: 'app-lineamiento-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <div class="container">
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando lineamiento...</p>
        </div>
      } @else if (error()) {
        <div class="error-card">
          <h2>
            <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Error
          </h2>
          <p>{{ error() }}</p>
          <button class="btn btn-secondary" (click)="goBack()">Volver</button>
        </div>
      } @else {
        <!-- Header -->
        <div class="header-card" [style.background]="getLineamientoColor()">
          <div class="header-content">
            <button class="btn-back" (click)="goBack()">← Volver al Programa</button>
            <div class="lineamiento-badge">LINEAMIENTO {{ numeroLineamiento() }}</div>
            <h1>
              <span class="lineamiento-title-icon" [innerHTML]="getLineamientoIconoSvg(numeroLineamiento())"></span>
              {{ getLineamientoNombre() }}
            </h1>
            <div class="programa-info">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              {{ programa()?.nombre }}
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="content-grid">
          <!-- Subir Evidencias -->
          <div class="upload-section">
            <div class="section-header">
              <h2>
                <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.2-9.19a4 4 0 0 1 5.65 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                Evidencias del Lineamiento
              </h2>
              <span class="count-badge">{{ evidencias().length }} archivo(s)</span>
            </div>
            <div class="section-body">
              <div class="upload-zone" (click)="evidenciasInput.click()">
                <div class="upload-icon" [innerHTML]="getSectionIconSvg('upload')"></div>
                <div class="upload-text">
                  <strong>Subir Evidencias</strong>
                  <p>Arrastra archivos PDF o haz clic para seleccionar</p>
                </div>
                <input
                  #evidenciasInput
                  type="file"
                  accept=".pdf"
                  multiple
                  (change)="onEvidenciasSelect($event)"
                  class="file-input"
                />
              </div>

              @if (evidencias().length > 0) {
                <div class="files-list">
                  <div class="list-header">
                    <span>Archivo</span>
                    <span>Tamaño</span>
                    <span>Fecha</span>
                    <span>Acciones</span>
                  </div>
                  @for (evidencia of evidencias(); track evidencia.id) {
                    <div class="file-row">
                      <div class="file-info">
                        <span class="file-icon" [innerHTML]="getSectionIconSvg('file')"></span>
                        <span class="file-name">{{ evidencia.nombreArchivoOriginal }}</span>
                      </div>
                      <span class="file-size">{{ formatBytes(evidencia.tamanoBytes) }}</span>
                      <span class="file-date">{{ formatDate(evidencia.fechaSubida) }}</span>
                      <div class="file-actions">
                        <button
                          class="btn-icon btn-download"
                          (click)="downloadEvidencia(evidencia.id)"
                          title="Descargar">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </button>
                        <button
                          class="btn-icon btn-delete"
                          (click)="deleteEvidencia(evidencia.id)"
                          title="Eliminar">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <div class="empty-icon" [innerHTML]="getSectionIconSvg('empty')"></div>
                  <p>No hay evidencias cargadas</p>
                  <p class="empty-hint">Las evidencias son documentos que respaldan este lineamiento</p>
                </div>
              }
            </div>
          </div>

          <!-- Subir Documentos Base -->
          <div class="upload-section">
            <div class="section-header">
              <h2>
                <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Documentos Base para IA
              </h2>
              <span class="count-badge">{{ documentosBase().length }} archivo(s)</span>
            </div>
            <div class="section-body">
              <div class="upload-zone" (click)="documentosInput.click()">
                <div class="upload-icon" [innerHTML]="getSectionIconSvg('ai')"></div>
                <div class="upload-text">
                  <strong>Subir Documentos para IA</strong>
                  <p>PDFs que la IA usará para generar contenido</p>
                </div>
                <input
                  #documentosInput
                  type="file"
                  accept=".pdf"
                  multiple
                  (change)="onDocumentosSelect($event)"
                  class="file-input"
                />
              </div>

              @if (documentosBase().length > 0) {
                <div class="files-list">
                  <div class="list-header">
                    <span>Archivo</span>
                    <span>Tamaño</span>
                    <span>Fecha</span>
                    <span>Acciones</span>
                  </div>
                  @for (doc of documentosBase(); track doc.id) {
                    <div class="file-row">
                      <div class="file-info">
                        <span class="file-icon" [innerHTML]="getSectionIconSvg('file')"></span>
                        <span class="file-name">{{ doc.nombreArchivo }}</span>
                      </div>
                      <span class="file-size">{{ formatBytes(doc.tamanoBytes) }}</span>
                      <span class="file-date">{{ formatDate(doc.fechaSubida!) }}</span>
                      <div class="file-actions">
                        <button
                          class="btn-icon btn-download"
                          (click)="downloadDocumento(doc.id!)"
                          title="Descargar">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </button>
                        <button
                          class="btn-icon btn-delete"
                          (click)="deleteDocumento(doc.id!)"
                          title="Eliminar">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <div class="empty-icon" [innerHTML]="getSectionIconSvg('ai')"></div>
                  <p>No hay documentos base cargados</p>
                  <p class="empty-hint">Estos documentos alimentan la IA para generar contenido</p>
                </div>
              }
            </div>
          </div>
        </div>

        @if (uploading()) {
          <div class="upload-overlay">
            <div class="upload-progress">
              <div class="spinner"></div>
              <p>Subiendo archivos...</p>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 1rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #e0e0e0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-card {
      background: #ffebee;
      border: 2px solid #f44336;
      border-radius: 0.5rem;
      padding: 2rem;
      text-align: center;
    }

    .error-card h2 {
      color: #d32f2f;
      margin: 0 0 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .title-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .header-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    }

    .btn-back {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 0.5rem;
      color: white;
      cursor: pointer;
      font-size: 0.95rem;
      margin-bottom: 1rem;
      transition: background 0.3s ease;
    }

    .btn-back:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .lineamiento-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.9);
      color: #667eea;
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 1rem;
      letter-spacing: 0.5px;
    }

    h1 {
      font-size: 2rem;
      margin: 0 0 0.5rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .lineamiento-title-icon {
      width: 28px;
      height: 28px;
      color: white;
      display: inline-flex;
    }

    .lineamiento-title-icon :is(svg) {
      width: 100%;
      height: 100%;
    }

    .programa-info {
      font-size: 1rem;
      opacity: 0.95;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
    }

    .meta-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 2rem;
    }

    .upload-section {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .section-header {
      padding: 1.5rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1.2rem;
      color: #333;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .count-badge {
      background: #667eea;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .section-body {
      padding: 1.5rem;
    }

    .upload-zone {
      border: 2px dashed #667eea;
      border-radius: 0.75rem;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f5f7ff;
    }

    .upload-zone:hover {
      border-color: #5568d3;
      background: #eef0ff;
      transform: translateY(-2px);
    }

    .upload-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 1rem;
      color: #667eea;
    }

    .upload-icon :is(svg) {
      width: 100%;
      height: 100%;
      margin-bottom: 1rem;
    }

    .upload-text strong {
      display: block;
      color: #333;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    .upload-text p {
      color: #666;
      font-size: 0.9rem;
      margin: 0;
    }

    .file-input {
      display: none;
    }

    .files-list {
      margin-top: 1.5rem;
    }

    .list-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 120px;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .file-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 120px;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      align-items: center;
      transition: all 0.2s ease;
    }

    .file-row:hover {
      background: #f9f9f9;
      border-color: #667eea;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .file-icon {
      width: 20px;
      height: 20px;
      display: inline-flex;
      color: #667eea;
      flex-shrink: 0;
    }

    .file-icon :is(svg) {
      width: 100%;
      height: 100%;
    }

    .file-name {
      font-weight: 500;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-size,
    .file-date {
      font-size: 0.9rem;
      color: #666;
    }

    .file-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .btn-icon {
      padding: 0.5rem;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 0.25rem;
      transition: all 0.2s ease;
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon svg {
      width: 18px;
      height: 18px;
    }

    .btn-icon:hover {
      transform: scale(1.2);
    }

    .btn-download:hover {
      background: #e3f2fd;
    }

    .btn-delete:hover {
      background: #ffebee;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .empty-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 1rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-icon :is(svg) {
      width: 100%;
      height: 100%;
    }

    .empty-state p {
      color: #666;
      margin: 0.5rem 0;
    }

    .empty-hint {
      font-size: 0.9rem;
      color: #999;
    }

    .upload-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .upload-progress {
      background: white;
      padding: 2rem;
      border-radius: 0.75rem;
      text-align: center;
    }

    .upload-progress p {
      margin-top: 1rem;
      font-weight: 600;
      color: #333;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-secondary {
      background: #667eea;
      color: white;
    }

    .btn-secondary:hover {
      background: #5568d3;
    }

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .list-header,
      .file-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .file-actions {
        justify-content: flex-start;
      }
    }
  `]
})
export class LineamientoDetailComponent implements OnInit {
  private programaService = inject(ProgramaService);
  private evidenciaService = inject(EvidenciaService);
  private documentoBaseService = inject(DocumentoBaseService);
  private lineamientoService = inject(LineamientoService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected programa = signal<ProgramaDTO | null>(null);
  protected numeroLineamiento = signal<number>(0);
  protected evidencias = signal<EvidenciaDTO[]>([]);
  protected documentosBase = signal<DocumentoBaseDTO[]>([]);
  protected loading = signal(true);
  protected uploading = signal(false);
  protected error = signal<string | null>(null);

  private lineamientoId: number | null = null;
  protected readonly LINEAMIENTOS = LINEAMIENTOS_DECRETO_1330;

  ngOnInit(): void {
    const programaId = this.route.snapshot.paramMap.get('id');
    const numeroLineamiento = this.route.snapshot.paramMap.get('lineamiento');

    if (programaId && numeroLineamiento) {
      this.numeroLineamiento.set(+numeroLineamiento);
      this.loadPrograma(+programaId);
      this.loadLineamientoData(+programaId, +numeroLineamiento);
    } else {
      this.error.set('Parámetros inválidos');
      this.loading.set(false);
    }
  }

  loadPrograma(id: number): void {
    this.programaService.getPrograma(id).subscribe({
      next: (data) => {
        this.programa.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading programa:', err);
        this.error.set('No se pudo cargar el programa');
        this.loading.set(false);
      }
    });
  }

  loadLineamientoData(programaId: number, numeroLineamiento: number): void {
    // Cargar lineamientos del programa y encontrar el específico
    this.lineamientoService.getLineamientos(programaId).subscribe({
      next: (lineamientos) => {
        const lineamiento = lineamientos.find(l => l.numero === numeroLineamiento);
        if (lineamiento) {
          this.lineamientoId = lineamiento.id;
          this.loadEvidencias(lineamiento.id);
        }
      },
      error: (err) => {
        console.error('Error loading lineamiento:', err);
      }
    });

    // Cargar documentos base del programa filtrados por tipo
    this.documentoBaseService.getDocumentosByPrograma(programaId).subscribe({
      next: (docs) => {
        // Filtrar documentos base (podrías agregar lógica para filtrar por lineamiento si el backend lo soporta)
        this.documentosBase.set(docs.filter(d => d.tipoDocumento === 'LINEAMIENTO'));
      },
      error: (err) => {
        console.error('Error loading documentos:', err);
      }
    });
  }

  loadEvidencias(lineamientoId: number): void {
    this.evidenciaService.getEvidenciasByLineamiento(lineamientoId).subscribe({
      next: (data) => {
        this.evidencias.set(data);
      },
      error: (err) => {
        console.error('Error loading evidencias:', err);
      }
    });
  }

  onEvidenciasSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !this.lineamientoId) return;

    this.uploading.set(true);
    const files = Array.from(input.files);
    let completed = 0;

    files.forEach(file => {
      this.evidenciaService.uploadEvidencia(this.lineamientoId!, file).subscribe({
        next: () => {
          completed++;
          if (completed === files.length) {
            this.uploading.set(false);
            this.loadEvidencias(this.lineamientoId!);
            input.value = '';
          }
        },
        error: (err) => {
          console.error('Error uploading evidencia:', err);
          completed++;
          if (completed === files.length) {
            this.uploading.set(false);
            alert('Error al subir algunos archivos');
          }
        }
      });
    });
  }

  onDocumentosSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !this.programa()) return;

    this.uploading.set(true);
    const files = Array.from(input.files);
    let completed = 0;

    files.forEach(file => {
      this.documentoBaseService.uploadDocumento(
        this.programa()!.id,
        file,
        TipoDocumentoBase.LINEAMIENTO
      ).subscribe({
        next: () => {
          completed++;
          if (completed === files.length) {
            this.uploading.set(false);
            this.loadLineamientoData(this.programa()!.id, this.numeroLineamiento());
            input.value = '';
          }
        },
        error: (err) => {
          console.error('Error uploading documento:', err);
          completed++;
          if (completed === files.length) {
            this.uploading.set(false);
            alert('Error al subir algunos archivos');
          }
        }
      });
    });
  }

  downloadEvidencia(id: number): void {
    this.evidenciaService.downloadEvidencia(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'evidencia.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading:', err);
        alert('Error al descargar');
      }
    });
  }

  downloadDocumento(id: number): void {
    this.documentoBaseService.downloadDocumento(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'documento.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading:', err);
        alert('Error al descargar');
      }
    });
  }

  deleteEvidencia(id: number): void {
    if (!confirm('¿Eliminar esta evidencia?')) return;

    this.evidenciaService.deleteEvidencia(id).subscribe({
      next: () => {
        this.loadEvidencias(this.lineamientoId!);
      },
      error: (err) => {
        console.error('Error deleting:', err);
        alert('Error al eliminar');
      }
    });
  }

  deleteDocumento(id: number): void {
    if (!confirm('¿Eliminar este documento?')) return;

    this.documentoBaseService.deleteDocumento(id).subscribe({
      next: () => {
        this.loadLineamientoData(this.programa()!.id, this.numeroLineamiento());
      },
      error: (err) => {
        console.error('Error deleting:', err);
        alert('Error al eliminar');
      }
    });
  }

  getLineamientoNombre(): string {
    const lin = this.LINEAMIENTOS.find(l => l.numero === this.numeroLineamiento());
    return lin ? lin.nombre : '';
  }

  getLineamientoIconoSvg(numero: number): SafeHtml {
    const iconos: Record<number, string> = {
      1: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
      2: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
      3: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      4: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      5: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>`,
      6: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      7: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
      8: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
      9: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`
    };

    return this.sanitizer.bypassSecurityTrustHtml(iconos[numero] ?? iconos[1]);
  }

  getSectionIconSvg(tipo: 'upload' | 'file' | 'empty' | 'ai'): SafeHtml {
    const iconos = {
      upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
      file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      empty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12H2"/><path d="M5.45 5.11L2 12l3.45 6.89A2 2 0 0 0 7.24 20h9.52a2 2 0 0 0 1.79-1.11L22 12l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
      ai: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`
    };

    return this.sanitizer.bypassSecurityTrustHtml(iconos[tipo]);
  }

  getLineamientoColor(): string {
    const lin = this.LINEAMIENTOS.find(l => l.numero === this.numeroLineamiento());
    return lin ? `linear-gradient(135deg, ${lin.color} 0%, #764ba2 100%)` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/programas', this.programa()?.id]);
  }
}
