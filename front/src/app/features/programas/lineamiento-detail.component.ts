import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProgramaService } from '../../core/services/programa.service';
import { EvidenciaService } from '../../core/services/evidencia.service';
import { LineamientoService } from '../../core/services/lineamiento.service';
import { SeccionService } from '../../core/services/seccion.service';
import { ProgramaDTO } from '../../core/models/programa.model';
import { EvidenciaDTO } from '../../core/models/evidencia.model';
import { IaRevisionResultDTO } from '../../core/models/seccion.model';
import { LineamientoDTO, LINEAMIENTOS_DECRETO_1330, COMPONENTES_CONDICION_3, ComponenteCondicion3 } from '../../core/models/lineamiento.model';

@Component({
  selector: 'app-lineamiento-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <div class="container">
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando condición...</p>
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
            @if (componenteSeleccionado()) {
              <button class="btn-back" (click)="volverAComponentes()">← Volver a Componentes</button>
            } @else {
              <button class="btn-back" (click)="goBack()">← Volver al Programa</button>
            }
            <div class="lineamiento-badge">
              @if (componenteSeleccionado()) {
                COMPONENTE {{ componenteSeleccionado() }}
              } @else {
                CONDICIÓN {{ numeroLineamiento() }}
              }
            </div>
            <h1>
              <span class="lineamiento-title-icon" [innerHTML]="getLineamientoIconoSvg(numeroLineamiento())"></span>
              @if (componenteSeleccionado()) {
                {{ getNombreComponente(componenteSeleccionado()!) }}
              } @else {
                {{ getLineamientoNombre() }}
              }
            </h1>
            <div class="programa-info">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              {{ programa()?.nombre }}
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="content-grid">
          <!-- Vista especial para Condición 3: Aspectos Curriculares -->
          @if (numeroLineamiento() === 3 && !componenteSeleccionado()) {
            <div class="componentes-condicion-3">
              <div class="componentes-header">
                <h2>Componentes de Aspectos Curriculares</h2>
                <p>Selecciona un componente para ver más detalles</p>
              </div>
              <div class="componentes-grid">
                @for (componente of COMPONENTES_CONDICION_3; track componente.letra) {
                  <button
                    class="componente-card"
                    (click)="verComponente(componente.letra)"
                    [style.border-left-color]="componente.color">
                    <div class="componente-letra" [style.background]="componente.color">{{ componente.letra }}</div>
                    <div class="componente-content">
                      <div class="componente-nombre">{{ componente.nombre }}</div>
                      <div class="componente-descripcion">{{ componente.descripcion }}</div>
                    </div>
                    <div class="componente-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </div>
                  </button>
                }
              </div>
            </div>
          }

          <!-- Subir Evidencias -->
          <div class="upload-section">
            <div class="section-header">
              <h2>
                <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.2-9.19a4 4 0 0 1 5.65 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                Evidencias de la Condición
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
                  <p class="empty-hint">Las evidencias son documentos que respaldan esta condición</p>
                </div>
              }
            </div>
          </div>

          <!-- Redacción y revisión IA -->
          @if (numeroLineamiento() !== 3 || componenteSeleccionado()) {
          <div class="upload-section">
            <div class="section-header">
              <h2>
                <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                Redacción de la condición
              </h2>
              @if (seccionId()) {
                <span class="estado-badge estado-{{ estadoSeccion().toLowerCase() }}">{{ estadoSeccion() }}</span>
              }
            </div>
            <div class="section-body ia-editor">
              <div>
                <label class="ia-hint">
                  Escribe aquí el texto final de este lineamiento. Una vez guardado, la IA puede revisarlo.
                </label>
                <textarea
                  class="ia-textarea"
                  [value]="textoLineamiento()"
                  (input)="onTextareaInput($event)"
                  placeholder="Redacta aquí el contenido de la condición según los requisitos del Decreto 1330..."
                ></textarea>
              </div>

              <div class="ia-actions">
                <button
                  class="btn btn-secondary"
                  type="button"
                  (click)="onGuardarContenido()"
                  [disabled]="guardandoTexto() || !lineamientoId">
                  {{ guardandoTexto() ? 'Guardando...' : 'Guardar' }}
                </button>
                <button
                  class="btn btn-primary"
                  type="button"
                  (click)="onRevisarConIA()"
                  [disabled]="revisandoIA() || !lineamientoId || !textoLineamiento().trim()">
                  {{ revisandoIA() ? 'Revisando...' : 'Revisar con IA' }}
                </button>
              </div>

              <!-- AI review result -->
              @if (iaResult()) {
                <div class="ia-result" [class]="'ia-result--' + iaResult()!.nivelRiesgo.toLowerCase()">
                  <div class="ia-result-header">
                    <span class="riesgo-badge riesgo-{{ iaResult()!.nivelRiesgo.toLowerCase() }}">
                      Riesgo {{ iaResult()!.nivelRiesgo }}
                    </span>
                    <span class="ia-result-title">Resultado de revisión IA</span>
                  </div>

                  <p class="ia-observaciones">{{ iaResult()!.observacionesGenerales }}</p>

                  @if (iaResult()!.recomendacionesConcretas.length > 0) {
                    <div class="ia-section">
                      <strong>Elementos a mejorar:</strong>
                      <ul>
                        @for (rec of iaResult()!.recomendacionesConcretas; track rec) {
                          <li>{{ rec }}</li>
                        }
                      </ul>
                    </div>
                  }

                  @if (iaResult()!.checklistCumplimiento.length > 0) {
                    <div class="ia-section">
                      <strong>Checklist de cumplimiento:</strong>
                      <ul>
                        @for (item of iaResult()!.checklistCumplimiento; track item) {
                          <li>{{ item }}</li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
          }
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
    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }

    .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 1rem; }

    .spinner { width: 50px; height: 50px; border: 4px solid #e0e0e0; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-card { background: #ffebee; border: 2px solid #f44336; border-radius: 0.5rem; padding: 2rem; text-align: center; }
    .error-card h2 { color: #d32f2f; margin: 0 0 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

    .title-icon { width: 20px; height: 20px; flex-shrink: 0; }

    .header-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 1rem; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3); }

    .btn-back { padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); border: none; border-radius: 0.5rem; color: white; cursor: pointer; font-size: 0.95rem; margin-bottom: 1rem; transition: background 0.3s ease; }
    .btn-back:hover { background: rgba(255,255,255,0.3); }

    .lineamiento-badge { display: inline-block; background: rgba(255,255,255,0.9); color: #667eea; padding: 0.5rem 1rem; border-radius: 2rem; font-size: 0.85rem; font-weight: 700; margin-bottom: 1rem; letter-spacing: 0.5px; }

    h1 { font-size: 2rem; margin: 0 0 0.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.75rem; }

    .lineamiento-title-icon { width: 28px; height: 28px; color: white; display: inline-flex; }
    .lineamiento-title-icon :is(svg) { width: 100%; height: 100%; }

    .programa-info { font-size: 1rem; opacity: 0.95; display: inline-flex; align-items: center; gap: 0.45rem; }
    .meta-icon { width: 18px; height: 18px; flex-shrink: 0; }

    .content-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 2rem; }

    .upload-section { background: white; border-radius: 0.75rem; box-shadow: 0 2px 10px rgba(0,0,0,0.08); overflow: hidden; }

    .section-header { padding: 1.5rem; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
    .section-header h2 { margin: 0; font-size: 1.2rem; color: #333; font-weight: 700; display: inline-flex; align-items: center; gap: 0.5rem; }

    .count-badge { background: #667eea; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.85rem; font-weight: 600; }

    .estado-badge { padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
    .estado-borrador { background: #fff3e0; color: #e65100; }
    .estado-en_revision { background: #e3f2fd; color: #1565c0; }
    .estado-validada { background: #e8f5e9; color: #2e7d32; }
    .estado-observada { background: #fce4ec; color: #880e4f; }

    .section-body { padding: 1.5rem; }
    .ia-editor { display: flex; flex-direction: column; gap: 1rem; }

    .ia-textarea { width: 100%; min-height: 220px; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #d1d5db; font-size: 0.95rem; resize: vertical; line-height: 1.5; box-sizing: border-box; }
    .ia-textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 1px rgba(102,126,234,0.3); }

    .ia-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem; }
    .ia-hint { font-size: 0.8rem; color: #6b7280; }

    /* IA result panel */
    .ia-result { border-radius: 0.5rem; padding: 1.25rem; margin-top: 1rem; border-left: 4px solid #ccc; background: #fafafa; }
    .ia-result--bajo { border-left-color: #4caf50; background: #f1f8f1; }
    .ia-result--medio { border-left-color: #ff9800; background: #fff8f0; }
    .ia-result--alto { border-left-color: #f44336; background: #fff5f5; }

    .ia-result-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .ia-result-title { font-weight: 700; color: #333; font-size: 0.95rem; }

    .riesgo-badge { padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
    .riesgo-bajo { background: #c8e6c9; color: #1b5e20; }
    .riesgo-medio { background: #ffe0b2; color: #bf360c; }
    .riesgo-alto { background: #ffcdd2; color: #b71c1c; }

    .ia-observaciones { color: #555; font-size: 0.95rem; margin: 0 0 0.75rem; line-height: 1.5; }
    .ia-section { margin-top: 0.75rem; }
    .ia-section strong { display: block; color: #333; font-size: 0.9rem; margin-bottom: 0.4rem; }
    .ia-section ul { margin: 0; padding-left: 1.25rem; }
    .ia-section li { color: #555; font-size: 0.9rem; margin-bottom: 0.25rem; line-height: 1.4; }

    .upload-zone { border: 2px dashed #667eea; border-radius: 0.75rem; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.3s ease; background: #f5f7ff; }
    .upload-zone:hover { border-color: #5568d3; background: #eef0ff; transform: translateY(-2px); }

    .upload-icon { width: 48px; height: 48px; margin: 0 auto 1rem; color: #667eea; }
    .upload-icon :is(svg) { width: 100%; height: 100%; margin-bottom: 1rem; }
    .upload-text strong { display: block; color: #333; font-size: 1.1rem; margin-bottom: 0.5rem; }
    .upload-text p { color: #666; font-size: 0.9rem; margin: 0; }
    .file-input { display: none; }

    .files-list { margin-top: 1.5rem; }
    .list-header { display: grid; grid-template-columns: 2fr 1fr 1fr 120px; gap: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem; font-weight: 600; font-size: 0.9rem; color: #666; margin-bottom: 0.5rem; }
    .file-row { display: grid; grid-template-columns: 2fr 1fr 1fr 120px; gap: 1rem; padding: 1rem; border: 1px solid #e0e0e0; border-radius: 0.5rem; margin-bottom: 0.5rem; align-items: center; transition: all 0.2s ease; }
    .file-row:hover { background: #f9f9f9; border-color: #667eea; }
    .file-info { display: flex; align-items: center; gap: 0.75rem; }
    .file-icon { width: 20px; height: 20px; display: inline-flex; color: #667eea; flex-shrink: 0; }
    .file-icon :is(svg) { width: 100%; height: 100%; }
    .file-name { font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-size, .file-date { font-size: 0.9rem; color: #666; }
    .file-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }

    .btn-icon { padding: 0.5rem; border: none; background: transparent; cursor: pointer; border-radius: 0.25rem; transition: all 0.2s ease; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; }
    .btn-icon svg { width: 18px; height: 18px; }
    .btn-icon:hover { transform: scale(1.2); }
    .btn-download:hover { background: #e3f2fd; }
    .btn-delete:hover { background: #ffebee; }

    .empty-state { text-align: center; padding: 3rem 1rem; }
    .empty-icon { width: 56px; height: 56px; margin: 0 auto 1rem; opacity: 0.5; }
    .empty-icon :is(svg) { width: 100%; height: 100%; }
    .empty-state p { color: #666; margin: 0.5rem 0; }
    .empty-hint { font-size: 0.9rem; color: #999; }

    .upload-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; }
    .upload-progress { background: white; padding: 2rem; border-radius: 0.75rem; text-align: center; }
    .upload-progress p { margin-top: 1rem; font-weight: 600; color: #333; }

    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #667eea; color: white; }
    .btn-primary:hover:not(:disabled) { background: #5568d3; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-secondary:hover:not(:disabled) { background: #d0d0d0; }

    .componentes-condicion-3 { grid-column: 1 / -1; background: white; border-radius: 0.75rem; padding: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    .componentes-header { margin-bottom: 2rem; }
    .componentes-header h2 { font-size: 1.3rem; color: #333; margin: 0 0 0.5rem; font-weight: 700; }
    .componentes-header p { color: #666; margin: 0; font-size: 0.95rem; }
    .componentes-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }

    .componente-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border: 2px solid #e0e0e0; border-left: 4px solid #667eea; border-radius: 0.5rem; cursor: pointer; transition: all 0.3s ease; text-align: left; }
    .componente-card:hover { border-color: #667eea; background: #f5f7ff; transform: translateY(-3px); box-shadow: 0 4px 12px rgba(102,126,234,0.2); }
    .componente-letra { min-width: 50px; min-height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; color: white; font-weight: 700; font-size: 1.3rem; flex-shrink: 0; }
    .componente-content { flex: 1; }
    .componente-nombre { font-weight: 600; color: #333; font-size: 0.95rem; line-height: 1.3; margin-bottom: 0.25rem; }
    .componente-descripcion { color: #666; font-size: 0.85rem; line-height: 1.3; }
    .componente-arrow { color: #667eea; display: flex; align-items: center; justify-content: center; }
    .componente-arrow svg { width: 18px; height: 18px; }

    @media (max-width: 768px) {
      .content-grid { grid-template-columns: 1fr; }
      .list-header, .file-row { grid-template-columns: 1fr; gap: 0.5rem; }
      .file-actions { justify-content: flex-start; }
    }
  `]
})
export class LineamientoDetailComponent implements OnInit {
  private programaService = inject(ProgramaService);
  private evidenciaService = inject(EvidenciaService);
  private lineamientoService = inject(LineamientoService);
  private seccionService = inject(SeccionService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected programa = signal<ProgramaDTO | null>(null);
  protected numeroLineamiento = signal<number>(0);
  protected componenteSeleccionado = signal<'A' | 'B' | 'C' | 'D' | 'E' | null>(null);
  protected evidencias = signal<EvidenciaDTO[]>([]);
  protected loading = signal(true);
  protected uploading = signal(false);
  protected error = signal<string | null>(null);
  protected textoLineamiento = signal<string>('');
  protected estadoSeccion = signal<string>('BORRADOR');
  protected guardandoTexto = signal(false);
  protected revisandoIA = signal(false);
  protected iaResult = signal<IaRevisionResultDTO | null>(null);

  lineamientoId: number | null = null;
  seccionId = signal<number | null>(null);

  protected readonly LINEAMIENTOS = LINEAMIENTOS_DECRETO_1330;
  protected readonly COMPONENTES_CONDICION_3 = COMPONENTES_CONDICION_3;

  ngOnInit(): void {
    const programaId =
      this.route.snapshot.paramMap.get('programaId') ??
      this.route.snapshot.paramMap.get('id');
    const numeroLineamiento =
      this.route.snapshot.paramMap.get('numero') ??
      this.route.snapshot.paramMap.get('lineamiento');
    const componente = this.route.snapshot.paramMap.get('componente') as 'A' | 'B' | 'C' | 'D' | 'E' | null;

    if (programaId && numeroLineamiento) {
      const programaIdNum = +programaId;
      const numeroLinNum = +numeroLineamiento;

      this.numeroLineamiento.set(numeroLinNum);
      if (componente) this.componenteSeleccionado.set(componente);

      this.loadPrograma(programaIdNum);
      this.loadLineamientoData(programaIdNum, numeroLinNum);
    } else {
      this.error.set('Parámetros inválidos');
      this.loading.set(false);
    }
  }

  loadPrograma(id: number): void {
    this.programaService.getPrograma(id).subscribe({
      next: (data) => { this.programa.set(data); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el programa'); this.loading.set(false); }
    });
  }

  loadLineamientoData(programaId: number, numeroLineamiento: number): void {
    this.lineamientoService.getLineamientos(programaId).subscribe({
      next: (lineamientos) => {
        const lin = lineamientos.find(l => l.numero === numeroLineamiento);
        if (lin) {
          this.lineamientoId = lin.id;
          this.loadEvidencias(lin.id);
          this.loadSeccion(lin.id);
        }
      },
      error: (err) => console.error('Error loading lineamiento:', err)
    });
  }

  private loadSeccion(lineamientoId: number): void {
    this.seccionService.getByLineamiento(lineamientoId).subscribe({
      next: (secciones) => {
        if (secciones.length > 0) {
          const sec = secciones[0];
          this.seccionId.set(sec.id);
          this.textoLineamiento.set(sec.contenidoRedactado ?? '');
          this.estadoSeccion.set(sec.estado);
        }
      },
      error: (err) => console.error('Error loading sección:', err)
    });
  }

  loadEvidencias(lineamientoId: number): void {
    this.evidenciaService.getEvidenciasByLineamiento(lineamientoId).subscribe({
      next: (data) => this.evidencias.set(data),
      error: (err) => console.error('Error loading evidencias:', err)
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

  onTextareaInput(event: Event): void {
    this.textoLineamiento.set((event.target as HTMLTextAreaElement).value);
  }

  onGuardarContenido(): void {
    if (!this.lineamientoId) return;

    this.guardandoTexto.set(true);
    this.seccionService.guardar(this.lineamientoId, {
      contenidoRedactado: this.textoLineamiento(),
      observaciones: '',
      estado: 'EN_REVISION'
    }).subscribe({
      next: (sec) => {
        this.seccionId.set(sec.id);
        this.estadoSeccion.set(sec.estado);
        this.guardandoTexto.set(false);
      },
      error: (err) => {
        console.error('Error guardando sección:', err);
        alert('No fue posible guardar el contenido.');
        this.guardandoTexto.set(false);
      }
    });
  }

  onRevisarConIA(): void {
    if (!this.lineamientoId || !this.textoLineamiento().trim()) return;

    this.revisandoIA.set(true);
    this.seccionService.guardar(this.lineamientoId, {
      contenidoRedactado: this.textoLineamiento(),
      observaciones: '',
      estado: 'EN_REVISION'
    }).subscribe({
      next: (sec) => {
        this.seccionId.set(sec.id);
        this.seccionService.revisarConIA(sec.id).subscribe({
          next: (result) => {
            this.iaResult.set(result);
            this.revisandoIA.set(false);
          },
          error: (err) => {
            console.error('Error revisando con IA:', err);
            alert('No fue posible obtener la revisión de la IA.');
            this.revisandoIA.set(false);
          }
        });
      },
      error: () => {
        alert('No se pudo guardar antes de revisar.');
        this.revisandoIA.set(false);
      }
    });
  }

  downloadEvidencia(id: number): void {
    this.evidenciaService.downloadEvidencia(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'evidencia.pdf'; a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Error al descargar')
    });
  }

  deleteEvidencia(id: number): void {
    if (!confirm('¿Eliminar esta evidencia?')) return;
    this.evidenciaService.deleteEvidencia(id).subscribe({
      next: () => this.loadEvidencias(this.lineamientoId!),
      error: () => alert('Error al eliminar')
    });
  }

  getLineamientoNombre(): string {
    return this.LINEAMIENTOS.find(l => l.numero === this.numeroLineamiento())?.nombre ?? '';
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  verComponente(componente: 'A' | 'B' | 'C' | 'D' | 'E'): void {
    if (!this.programa()) return;
    this.router.navigate(['/programas', this.programa()!.id, 'lineamiento', this.numeroLineamiento(), 'componente', componente]);
  }

  volverAComponentes(): void {
    if (!this.programa()) return;
    this.router.navigate(['/programas', this.programa()!.id, 'lineamiento', this.numeroLineamiento()]);
  }

  getNombreComponente(letra: 'A' | 'B' | 'C' | 'D' | 'E'): string {
    return COMPONENTES_CONDICION_3.find(c => c.letra === letra)?.nombre ?? `Componente ${letra}`;
  }

  goBack(): void {
    this.router.navigate(['/programas', this.programa()?.id]);
  }
}
