import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { EvidenciaService } from '../../core/services/evidencia.service';
import { LineamientoService } from '../../core/services/lineamiento.service';
import { ProgramaService } from '../../core/services/programa.service';
import { SeccionService } from '../../core/services/seccion.service';
import { AuthService } from '../../core/services/auth.service';
import { HistorialCambioService } from '../../core/services/historial-cambio.service';
import { EvidenciaDTO } from '../../core/models/evidencia.model';
import { HistorialCambioDTO } from '../../core/models/historial-cambio.model';
import { LineamientoDTO, LINEAMIENTOS_DECRETO_1330 } from '../../core/models/lineamiento.model';
import { ProgramaDTO } from '../../core/models/programa.model';
import {
  ActualizarSeccionRequest,
  EstadoSeccion,
  IaRevisionResultDTO,
  RecomendarTextoMode,
  RecomendarTextoResponse,
  SeccionDTO
} from '../../core/models/seccion.model';

@Component({
  selector: 'app-lineamiento-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando condicion...</p>
        </div>
      } @else if (error()) {
        <div class="error-card">
          <h2>Error</h2>
          <p>{{ error() }}</p>
          <button class="btn btn-secondary" type="button" (click)="goBack()">Volver</button>
        </div>
      } @else {
        <section class="header-card" [style.background]="getLineamientoColor()">
          <button class="btn-back" type="button" (click)="goBack()">Volver al programa</button>
          <div class="lineamiento-badge">CONDICION {{ numeroLineamiento() }}</div>
          <h1>{{ getLineamientoNombre() }}</h1>
          <div class="programa-info">{{ programa()?.nombre }}</div>
        </section>

        <div class="content-grid">
          <section class="panel panel-full">
            <div class="section-header">
              <h2>Descripcion de la condicion</h2>
              <button
                class="btn btn-secondary"
                type="button"
                (click)="onGuardarDescripcion()"
                [disabled]="guardandoDescripcion() || !lineamientoId">
                {{ guardandoDescripcion() ? 'Guardando...' : 'Guardar descripcion' }}
              </button>
            </div>
            <div class="section-body">
              <textarea
                class="description-textarea"
                [value]="descripcionCondicion()"
                (input)="onDescripcionInput($event)"
                placeholder="Describe el alcance, enfoque o notas internas de esta condicion...">
              </textarea>
            </div>
          </section>

          <section class="panel">
            <div class="section-header">
              <h2>Evidencias de la condicion</h2>
              <span class="count-badge">{{ evidencias().length }} archivo(s)</span>
            </div>
            <div class="section-body">
              <div class="upload-zone" (click)="evidenciasInput.click()">
                <strong>Subir evidencias</strong>
                <p>Selecciona archivos PDF asociados a esta condicion.</p>
                <input
                  #evidenciasInput
                  class="file-input"
                  type="file"
                  accept=".pdf"
                  multiple
                  (change)="onEvidenciasSelect($event)" />
              </div>

              @if (evidencias().length > 0) {
                <div class="files-list">
                  @for (evidencia of evidencias(); track evidencia.id) {
                    <div class="file-row">
                      <div class="file-info">
                        <strong>{{ evidencia.nombreArchivoOriginal }}</strong>
                        <span>{{ formatBytes(evidencia.tamanoBytes) }} | {{ formatDate(evidencia.fechaSubida) }}</span>
                      </div>
                      <div class="file-actions">
                        <button class="btn-icon" type="button" title="Descargar" (click)="downloadEvidencia(evidencia.id)">v</button>
                        @if (canDeleteEvidencia()) {
                          <button class="btn-icon btn-danger" type="button" title="Eliminar" (click)="deleteEvidencia(evidencia.id)">x</button>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <p>No hay evidencias cargadas.</p>
                  <span>La IA recibe las evidencias de toda la condicion al revisar cualquier seccion.</span>
                </div>
              }
            </div>
          </section>

          <section class="panel">
            <div class="section-header">
              <h2>Secciones de la condicion</h2>
              <button class="btn btn-secondary" type="button" (click)="toggleCrearSeccion()">
                {{ creandoSeccion() ? 'Cancelar' : 'Nueva seccion' }}
              </button>
            </div>
            <div class="section-body section-list-body">
              @if (creandoSeccion()) {
                <div class="create-section">
                  <input
                    class="text-input code-input"
                    [value]="nuevaSeccionCodigo()"
                    (input)="onNuevaSeccionCodigoInput($event)"
                    placeholder="Codigo" />
                  <input
                    class="text-input"
                    [value]="nuevaSeccionTitulo()"
                    (input)="onNuevaSeccionTituloInput($event)"
                    placeholder="Titulo de la seccion" />
                  <button class="btn btn-primary" type="button" (click)="onCrearSeccion()" [disabled]="guardandoSeccion()">
                    Crear
                  </button>
                </div>
              }

              @if (secciones().length > 0) {
                <div class="section-tabs">
                  @for (seccion of secciones(); track seccion.id) {
                    <button
                      class="section-tab"
                      type="button"
                      [class.active]="seccion.id === seccionId()"
                      (click)="seleccionarSeccion(seccion)">
                      <span class="section-code">{{ seccion.codigoSeccion }}</span>
                      <span class="section-title">{{ seccion.titulo || 'Sin titulo' }}</span>
                      <span class="estado-badge estado-{{ seccion.estado.toLowerCase() }}">{{ seccion.estado }}</span>
                    </button>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <p>No hay secciones creadas.</p>
                </div>
              }
            </div>
          </section>

          <section class="panel history-panel">
            <div class="section-header">
              <h2>Historial de modificaciones</h2>
              @if (historialLoading()) {
                <span class="count-badge">Cargando</span>
              } @else {
                <span class="count-badge">{{ historialCondicion().length }} cambio(s)</span>
              }
            </div>
            <div class="section-body history-body">
              @for (item of historialCondicion(); track item.id) {
                <article class="history-item">
                  <div class="history-top">
                    <span class="history-action action-{{ item.accion.toLowerCase() }}">{{ labelAccion(item.accion) }}</span>
                    <time>{{ formatHistoryDate(item.fecha) }}</time>
                  </div>
                  <p class="history-detail">{{ item.detalle || 'Cambio registrado' }}</p>
                  <div class="history-meta">
                    <strong>{{ item.seccionCodigo || 'Condicion ' + item.condicionNumero }}</strong>
                    <span>{{ item.nombreCompleto || item.username }} · {{ item.rol || item.username }}</span>
                  </div>
                </article>
              } @empty {
                <div class="empty-state">
                  <p>No hay modificaciones registradas.</p>
                  <span>Al guardar el texto de una seccion apareceran aqui el responsable y la fecha.</span>
                </div>
              }
            </div>
          </section>

          <section class="panel panel-full">
            <div class="section-header">
              <h2>Redaccion y revision IA por seccion</h2>
              @if (seccionId()) {
                <span class="estado-badge estado-{{ estadoSeccion().toLowerCase() }}">{{ estadoSeccion() }}</span>
              }
            </div>
            <div class="section-body editor-body">
              <div class="section-fields">
                <label>
                  Codigo
                  <input class="text-input" [value]="seccionCodigo()" (input)="onSeccionCodigoInput($event)" />
                </label>
                <label>
                  Titulo editable
                  <input class="text-input" [value]="seccionTitulo()" (input)="onSeccionTituloInput($event)" />
                </label>
                <label>
                  Orden
                  <input class="text-input" type="number" min="1" [value]="seccionOrden()" (input)="onSeccionOrdenInput($event)" />
                </label>
                @if (canDeleteSeccion()) {
                  <button
                    class="btn btn-danger"
                    type="button"
                    (click)="onEliminarSeccion()"
                    [disabled]="!seccionId() || secciones().length <= 1 || guardandoSeccion()">
                    Eliminar seccion
                  </button>
                }
              </div>

              <textarea
                class="ia-textarea"
                [value]="textoLineamiento()"
                (input)="onTextareaInput($event)"
                placeholder="Redacta aqui el contenido completo de esta seccion. El campo no limita la extension; puedes ajustar su altura.">
              </textarea>

              <div class="ia-actions">
                <button
                  class="btn btn-secondary"
                  type="button"
                  (click)="onGuardarContenido()"
                  [disabled]="guardandoTexto() || !lineamientoId || !seccionCodigo().trim() || !seccionTitulo().trim()">
                  {{ guardandoTexto() ? 'Guardando...' : 'Guardar seccion' }}
                </button>
                <button
                  class="btn btn-ai"
                  type="button"
                  (click)="abrirRecomendarTexto()"
                  [disabled]="!lineamientoId || !seccionId() || !seccionTitulo().trim() || !puedeRecomendarTexto()"
                  [title]="puedeRecomendarTexto()
                    ? 'Pide a la IA un texto sugerido para esta seccion'
                    : 'Agrega titulo de seccion, descripcion de condicion, contenido previo o evidencias antes de pedir asistencia IA.'">
                  Recomendar texto IA
                </button>
                <button
                  class="btn btn-primary"
                  type="button"
                  (click)="onRevisarConIA()"
                  [disabled]="revisandoIA() || !lineamientoId || !textoLineamiento().trim()">
                  {{ revisandoIA() ? 'Revisando...' : 'Revisar con IA' }}
                </button>
              </div>

              @if (iaResult()) {
                <div class="ia-result" [class]="getIaResultClass()">
                  <div class="ia-result-header">
                    <span class="riesgo-badge" [class]="getRiskBadgeClass()">Riesgo {{ iaResult()!.nivelRiesgo }}</span>
                    <strong>{{ iaResult()!.insufficientContext ? 'No hay contexto suficiente' : 'Resultado de revision IA' }}</strong>
                    @if (iaResult()!.cacheHit) {
                      <span class="cache-chip">Cache</span>
                    }
                  </div>

                  <p class="ia-observaciones">{{ iaResult()!.observacionesGenerales }}</p>

                  @if (iaResult()!.recomendacionesConcretas.length > 0) {
                    <div class="ia-section">
                      <strong>Elementos a mejorar</strong>
                      <ul>
                        @for (rec of iaResult()!.recomendacionesConcretas; track rec) {
                          <li>{{ rec }}</li>
                        }
                      </ul>
                    </div>
                  }

                  @if (iaResult()!.checklistCumplimiento.length > 0) {
                    <div class="ia-section">
                      <strong>Checklist de cumplimiento</strong>
                      <ul>
                        @for (item of iaResult()!.checklistCumplimiento; track item) {
                          <li>{{ item }}</li>
                        }
                      </ul>
                    </div>
                  }

                  @if (iaResult()!.citas.length > 0) {
                    <details class="ia-section">
                      <summary>Citas y evidencias usadas ({{ iaResult()!.citas.length }})</summary>
                      <div class="citation-list">
                        @for (cita of iaResult()!.citas; track cita.chunkId) {
                          <div class="citation-item">
                            <div class="citation-meta">
                              <strong>{{ cita.sourceName || 'Fuente IA' }}</strong>
                              @if (cita.pageStart) {
                                <span>{{ formatPageRange(cita.pageStart, cita.pageEnd) }}</span>
                              }
                              <span>{{ shortenId(cita.chunkId) }}</span>
                            </div>
                            <blockquote>{{ cita.quote }}</blockquote>
                          </div>
                        }
                      </div>
                    </details>
                  }

                  @if (iaResult()!.insufficientContext && iaResult()!.retrievalDiagnostics) {
                    <div class="ia-section diagnostics-panel">
                      <strong>Diagnostico de recuperacion</strong>
                      <div class="metadata-grid">
                        <span>Candidatos crudos</span><b>{{ iaResult()!.retrievalDiagnostics!.rawResultsFound }}</b>
                        <span>Sobre umbral</span><b>{{ iaResult()!.retrievalDiagnostics!.resultsAfterThreshold }}</b>
                        <span>Umbral</span><b>{{ formatNumber(iaResult()!.retrievalDiagnostics!.threshold) }}</b>
                        <span>Maxima similitud</span><b>{{ formatNumber(iaResult()!.retrievalDiagnostics!.maxSimilarity) }}</b>
                      </div>
                    </div>
                  }

                  <details class="ia-section">
                    <summary>Metadata de auditoria</summary>
                    <div class="metadata-grid">
                      <span>Modelo</span><b>{{ iaResult()!.modeloUsado || 'N/D' }}</b>
                      <span>Costo estimado</span><b>{{ formatUsd(iaResult()!.costoEstimadoUsd) }}</b>
                      <span>Cache</span><b>{{ iaResult()!.cacheHit ? 'Si' : 'No' }}</b>
                      <span>OpenAI llamado</span><b>{{ iaResult()!.aiCalled ? 'Si' : 'No' }}</b>
                    </div>
                  </details>
                </div>
              }
            </div>
          </section>
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

      @if (recomendarOpen()) {
        <div class="recomendar-overlay" (click)="cerrarRecomendarTexto()">
          <div class="recomendar-modal" (click)="$event.stopPropagation()">
            <header class="recomendar-head">
              <div>
                <div class="recomendar-eyebrow">ASISTENCIA IA &middot; TEXTO SUGERIDO</div>
                <h2>{{ tituloRecomendar() }}</h2>
                <div class="recomendar-sub">
                  Condicion {{ numeroLineamiento() }} &middot; {{ getLineamientoNombre() }}
                </div>
              </div>
              <button class="btn-close" type="button" (click)="cerrarRecomendarTexto()" aria-label="Cerrar">x</button>
            </header>

            <div class="recomendar-body">
              <label class="user-instruction-label">
                Indicacion opcional (max 280 caracteres)
                <input
                  class="text-input"
                  type="text"
                  maxlength="280"
                  [value]="recomendarUserInstruction()"
                  (input)="onRecomendarInstructionInput($event)"
                  placeholder="Ej: enfatizar el componente practico"
                  [disabled]="recomendandoTexto()" />
              </label>

              <div class="recomendar-mode-row">
                <span class="mode-chip">{{ modoSugeridoLabel() }}</span>
                <button
                  class="btn btn-primary"
                  type="button"
                  (click)="ejecutarRecomendarTexto()"
                  [disabled]="recomendandoTexto() || !seccionId()">
                  {{ recomendandoTexto() ? 'Generando...' : (recomendarResult() ? 'Volver a generar' : 'Generar texto sugerido') }}
                </button>
              </div>

              @if (recomendandoTexto()) {
                <div class="recomendar-loading">
                  <div class="spinner"></div>
                  <p>Construyendo recomendacion con el contexto disponible...</p>
                </div>
              } @else if (recomendarError()) {
                <div class="recomendar-error">
                  <strong>No se pudo generar la recomendacion</strong>
                  <p>{{ recomendarError() }}</p>
                </div>
              } @else if (recomendarResult(); as result) {
                @if (result.suggestedTitle) {
                  <div class="suggested-title">
                    <span class="label">Titulo sugerido</span>
                    <span class="value">{{ result.suggestedTitle }}</span>
                  </div>
                }

                <div class="suggested-text">
                  <span class="label">Texto sugerido</span>
                  <pre>{{ result.suggestedText || '(sin texto)' }}</pre>
                </div>

                @if (result.rationale) {
                  <div class="rationale-block">
                    <span class="label">Por que se propone este texto</span>
                    <p>{{ result.rationale }}</p>
                  </div>
                }

                @if (result.usedContext.length > 0) {
                  <div class="context-block">
                    <span class="label">Contexto utilizado</span>
                    <div class="context-tags">
                      @for (item of result.usedContext; track item.nombre) {
                        <span class="context-tag tag-{{ item.tipo.toLowerCase() }}">
                          <small>{{ item.tipo }}</small>
                          {{ item.nombre }}
                        </span>
                      }
                    </div>
                  </div>
                }

                @if (result.warnings.length > 0) {
                  <div class="warnings-block">
                    <span class="label">Advertencias</span>
                    <ul>
                      @for (w of result.warnings; track w) {
                        <li>{{ w }}</li>
                      }
                    </ul>
                  </div>
                }

                <div class="audit-meta">
                  <span>Modo: <b>{{ result.modeUsed }}</b></span>
                  <span>Modelo: <b>{{ result.modeloUsado || 'N/D' }}</b></span>
                  <span>Costo: <b>{{ formatUsd(result.costoEstimadoUsd ?? undefined) }}</b></span>
                  @if (result.cacheHit) {
                    <span class="cache-chip">Cache</span>
                  }
                </div>
              } @else {
                <div class="recomendar-empty">
                  <p>
                    La IA usara el contexto disponible (programa, condicion, secciones y evidencias)
                    para proponerte un texto. Puedes agregar una indicacion opcional antes de generar.
                  </p>
                </div>
              }
            </div>

            <footer class="recomendar-actions">
              <button class="btn btn-secondary" type="button" (click)="cerrarRecomendarTexto()">Cerrar</button>
              <button
                class="btn btn-secondary"
                type="button"
                (click)="copiarSugerido()"
                [disabled]="!recomendarResult()?.suggestedText">
                {{ copiadoFlash() ? 'Copiado!' : 'Copiar texto' }}
              </button>
              <button
                class="btn btn-primary"
                type="button"
                (click)="insertarSugerido()"
                [disabled]="!recomendarResult()?.suggestedText">
                Insertar en seccion
              </button>
            </footer>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
    .loading { min-height: 420px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; }
    .spinner { width: 48px; height: 48px; border: 4px solid #e5e7eb; border-top-color: #007b00; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-card, .panel { background: white; border-radius: 0.75rem; box-shadow: 0 2px 10px rgba(0,0,0,0.08); overflow: hidden; }
    .error-card { padding: 2rem; text-align: center; border: 1px solid #fecaca; }
    .header-card { color: white; border-radius: 1rem; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 20px rgba(0, 92, 0, 0.25); }
    .btn-back { border: 0; border-radius: 0.5rem; color: white; background: rgba(255,255,255,0.2); padding: 0.55rem 0.9rem; cursor: pointer; margin-bottom: 1rem; }
    .lineamiento-badge { display: inline-block; background: rgba(255,255,255,0.92); color: #006600; padding: 0.45rem 0.85rem; border-radius: 999px; font-size: 0.78rem; font-weight: 800; }
    h1 { margin: 0.9rem 0 0.4rem; font-size: 2rem; line-height: 1.15; }
    .programa-info { opacity: 0.94; }

    .content-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, 0.7fr); gap: 1.5rem; align-items: start; }
    .panel-full { grid-column: 1 / -1; }
    .section-header { padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .section-header h2 { margin: 0; font-size: 1.1rem; color: #1f2937; }
    .section-body { padding: 1.5rem; }

    .description-textarea, .ia-textarea { width: 100%; box-sizing: border-box; border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 0.85rem; font-size: 0.95rem; line-height: 1.55; resize: vertical; }
    .description-textarea { min-height: 120px; }
    .ia-textarea { min-height: 430px; max-height: 72vh; overflow: auto; }
    .description-textarea:focus, .ia-textarea:focus, .text-input:focus { outline: none; border-color: #006600; box-shadow: 0 0 0 2px rgba(0,102,0,0.12); }

    .upload-zone { border: 2px dashed #15803d; background: #f0fdf4; border-radius: 0.75rem; padding: 1.5rem; text-align: center; cursor: pointer; }
    .upload-zone p { margin: 0.35rem 0 0; color: #4b5563; font-size: 0.9rem; }
    .file-input { display: none; }
    .files-list { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.65rem; }
    .file-row { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.85rem; display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
    .file-info { min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
    .file-info strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-info span, .empty-state span { color: #6b7280; font-size: 0.85rem; }
    .file-actions { display: flex; gap: 0.4rem; }

    .section-list-body { display: flex; flex-direction: column; gap: 1rem; }
    .create-section { display: grid; grid-template-columns: 110px minmax(0, 1fr) auto; gap: 0.65rem; align-items: center; }
    .section-tabs { display: flex; flex-direction: column; gap: 0.6rem; }
    .section-tab { border: 1px solid #e5e7eb; background: white; border-radius: 0.5rem; padding: 0.85rem; text-align: left; cursor: pointer; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 0.75rem; align-items: center; }
    .section-tab.active { border-color: #15803d; background: #f0fdf4; box-shadow: 0 0 0 1px #15803d inset; }
    .section-code { color: #15803d; font-weight: 800; }
    .section-title { color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .editor-body { display: flex; flex-direction: column; gap: 1rem; }
    .section-fields { display: grid; grid-template-columns: 150px minmax(0, 1fr) 110px auto; gap: 0.75rem; align-items: end; }
    .section-fields label { display: flex; flex-direction: column; gap: 0.35rem; color: #4b5563; font-size: 0.82rem; font-weight: 700; }
    .text-input { height: 40px; border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 0 0.75rem; font-size: 0.92rem; box-sizing: border-box; min-width: 0; }
    .code-input { text-transform: uppercase; }
    .ia-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.75rem; }

    .btn { border: 0; border-radius: 0.5rem; padding: 0.72rem 1rem; font-size: 0.92rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-primary { background: #006600; color: white; }
    .btn-secondary { background: #e5e7eb; color: #1f2937; }
    .btn-danger { background: #fee2e2; color: #991b1b; }
    .btn-icon { width: 34px; height: 34px; border: 0; border-radius: 0.35rem; background: #e5e7eb; cursor: pointer; font-size: 1.1rem; }
    .btn-icon.btn-danger { background: #fee2e2; color: #991b1b; }
    .count-badge, .estado-badge, .cache-chip { border-radius: 999px; padding: 0.25rem 0.7rem; font-size: 0.76rem; font-weight: 800; white-space: nowrap; }
    .count-badge { background: #006600; color: white; }

    .history-panel { grid-column: 2; }
    .history-body { display: flex; flex-direction: column; gap: 0; padding: 0; }
    .history-item {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #edf1f5;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .history-item:last-child { border-bottom: 0; }
    .history-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }
    .history-action {
      border-radius: 999px;
      padding: 0.2rem 0.55rem;
      color: #fff;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .action-crear, .action-subir { background: #006600; }
    .action-actualizar { background: #0f766e; }
    .action-eliminar { background: #b91c1c; }
    .history-top time {
      color: #64748b;
      font-size: 0.78rem;
      white-space: nowrap;
    }
    .history-detail {
      margin: 0;
      color: #334155;
      font-size: 0.88rem;
      line-height: 1.45;
    }
    .history-meta {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .history-meta strong {
      color: #1f2937;
      font-size: 0.86rem;
    }
    .history-meta span {
      color: #64748b;
      font-size: 0.8rem;
    }
    .estado-borrador { background: #fff7ed; color: #c2410c; }
    .estado-en_revision { background: #dbeafe; color: #1d4ed8; }
    .estado-validada { background: #dcfce7; color: #166534; }
    .estado-observada { background: #fce7f3; color: #9d174d; }
    .empty-state { border: 1px dashed #d1d5db; border-radius: 0.5rem; padding: 1.5rem; text-align: center; color: #4b5563; }

    .ia-result { border-left: 4px solid #9ca3af; border-radius: 0.5rem; background: #f9fafb; padding: 1.1rem; }
    .ia-result--bajo { border-left-color: #22c55e; background: #f0fdf4; }
    .ia-result--medio { border-left-color: #f59e0b; background: #fffbeb; }
    .ia-result--alto { border-left-color: #ef4444; background: #fef2f2; }
    .ia-result--sin-contexto { border-left-color: #f59e0b; background: #fffbeb; }
    .ia-result-header { display: flex; flex-wrap: wrap; gap: 0.7rem; align-items: center; margin-bottom: 0.8rem; }
    .riesgo-bajo { background: #bbf7d0; color: #14532d; }
    .riesgo-medio { background: #fde68a; color: #92400e; }
    .riesgo-alto { background: #fecaca; color: #991b1b; }
    .riesgo-sin-contexto { background: #fef3c7; color: #92400e; }
    .cache-chip { background: #e0f2fe; color: #075985; }
    .ia-observaciones { color: #374151; line-height: 1.55; }
    .ia-section { margin-top: 0.9rem; }
    .ia-section summary { cursor: pointer; font-weight: 800; }
    .ia-section li { margin-bottom: 0.28rem; line-height: 1.45; }
    .citation-list { margin-top: 0.75rem; display: grid; gap: 0.75rem; }
    .citation-item { border: 1px solid #e5e7eb; background: rgba(255,255,255,0.75); border-radius: 0.5rem; padding: 0.8rem; }
    .citation-meta { display: flex; flex-wrap: wrap; gap: 0.45rem; font-size: 0.78rem; color: #4b5563; margin-bottom: 0.45rem; }
    .citation-meta span { background: #f1f5f9; border-radius: 999px; padding: 0.15rem 0.45rem; }
    blockquote { margin: 0; border-left: 3px solid #15803d; padding-left: 0.75rem; color: #374151; line-height: 1.45; }
    .metadata-grid { display: grid; grid-template-columns: minmax(130px, auto) 1fr; gap: 0.4rem 0.8rem; font-size: 0.86rem; }
    .diagnostics-panel { border-radius: 0.5rem; padding: 0.8rem; background: rgba(245,158,11,0.08); }

    .upload-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .upload-progress { background: white; border-radius: 0.75rem; padding: 2rem; text-align: center; }

    /* ── Recomendar texto IA modal ───────────────────────────────────────── */
    .btn-ai { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .btn-ai:hover:not(:disabled) { background: #d1fae5; }

    .recomendar-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 1050; padding: 1.5rem;
    }
    .recomendar-modal {
      background: white; border-radius: 1rem; width: 100%; max-width: 880px;
      max-height: 94vh; display: flex; flex-direction: column;
      box-shadow: 0 24px 64px rgba(15, 23, 42, 0.35); overflow: hidden;
    }
    .recomendar-head {
      padding: 1.25rem 1.5rem; display: flex; align-items: flex-start;
      justify-content: space-between; gap: 1rem; border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%);
    }
    .recomendar-head h2 { margin: 0.35rem 0 0.25rem; font-size: 1.35rem; color: #1f2937; }
    .recomendar-eyebrow {
      font-size: 0.72rem; font-weight: 800; letter-spacing: 1.4px; color: #047857;
    }
    .recomendar-sub { font-size: 0.86rem; color: #4b5563; }
    .btn-close {
      border: 0; background: rgba(15, 23, 42, 0.05); width: 32px; height: 32px;
      border-radius: 50%; font-size: 1rem; cursor: pointer; color: #1f2937;
    }
    .btn-close:hover { background: rgba(15, 23, 42, 0.1); }

    .recomendar-body {
      padding: 1.25rem 1.5rem; overflow: auto; display: flex; flex-direction: column; gap: 1rem;
    }
    .user-instruction-label {
      display: flex; flex-direction: column; gap: 0.35rem;
      font-size: 0.82rem; font-weight: 700; color: #374151;
    }
    .recomendar-mode-row {
      display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;
      justify-content: space-between;
    }
    .mode-chip {
      background: #f1f5f9; color: #1f2937; border-radius: 999px;
      padding: 0.35rem 0.9rem; font-size: 0.82rem; font-weight: 700;
    }
    .recomendar-loading {
      display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
      padding: 2rem 0; color: #4b5563;
    }
    .recomendar-error {
      background: #fef2f2; border-left: 4px solid #ef4444; padding: 0.9rem 1rem;
      border-radius: 0.5rem; color: #991b1b;
    }
    .recomendar-error strong { display: block; margin-bottom: 0.25rem; }
    .recomendar-empty {
      background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 0.5rem;
      padding: 1.25rem; color: #4b5563; font-size: 0.92rem;
    }

    .suggested-title { display: flex; flex-direction: column; gap: 0.25rem; }
    .suggested-title .value { font-weight: 700; color: #1f2937; font-size: 1.02rem; }
    .label {
      font-size: 0.72rem; font-weight: 800; letter-spacing: 1.2px;
      color: #6b7280; text-transform: uppercase;
    }
    .suggested-text pre {
      margin: 0; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.55rem;
      padding: 0.9rem 1rem; font-family: inherit; font-size: 0.96rem; line-height: 1.6;
      color: #1f2937; white-space: pre-wrap; word-break: break-word;
      max-height: 60vh; overflow: auto;
    }
    .rationale-block p { margin: 0.35rem 0 0; color: #374151; line-height: 1.5; }

    .context-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.4rem; }
    .context-tag {
      background: #f1f5f9; border-radius: 999px; padding: 0.25rem 0.75rem;
      font-size: 0.82rem; color: #1f2937; display: inline-flex; gap: 0.35rem;
      align-items: center;
    }
    .context-tag small {
      font-size: 0.62rem; font-weight: 800; letter-spacing: 1px;
      color: #6b7280;
    }
    .tag-condition { background: #ecfdf5; }
    .tag-section   { background: #eff6ff; }
    .tag-attachment{ background: #fef3c7; }
    .tag-program   { background: #fae8ff; }
    .tag-normative { background: #fee2e2; }

    .warnings-block ul { margin: 0.4rem 0 0; padding-left: 1.25rem; color: #92400e; }
    .warnings-block li { margin-bottom: 0.25rem; line-height: 1.45; }

    .audit-meta {
      display: flex; flex-wrap: wrap; gap: 0.75rem; padding-top: 0.6rem;
      border-top: 1px dashed #e5e7eb; font-size: 0.82rem; color: #4b5563;
    }

    .recomendar-actions {
      padding: 0.9rem 1.5rem; border-top: 1px solid #e5e7eb;
      display: flex; gap: 0.6rem; justify-content: flex-end; flex-wrap: wrap;
      background: #f9fafb;
    }

    @media (max-width: 640px) {
      .recomendar-modal { max-height: 96vh; border-radius: 0.75rem; }
      .recomendar-actions { justify-content: stretch; }
      .recomendar-actions .btn { flex: 1; min-width: 110px; }
    }

    @media (max-width: 900px) {
      .container { padding: 1rem; }
      .content-grid, .section-fields, .create-section { grid-template-columns: 1fr; }
      .panel-full, .history-panel { grid-column: auto; }
      .section-header { align-items: flex-start; flex-direction: column; }
      .section-tab { grid-template-columns: 1fr; }
      .ia-actions { justify-content: stretch; }
      .ia-actions .btn { flex: 1; }
    }
  `]
})
export class LineamientoDetailComponent implements OnInit {
  private programaService = inject(ProgramaService);
  private evidenciaService = inject(EvidenciaService);
  private lineamientoService = inject(LineamientoService);
  private seccionService = inject(SeccionService);
  private authService = inject(AuthService);
  private historialCambioService = inject(HistorialCambioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected programa = signal<ProgramaDTO | null>(null);
  protected lineamientoActual = signal<LineamientoDTO | null>(null);
  protected numeroLineamiento = signal(0);
  protected evidencias = signal<EvidenciaDTO[]>([]);
  protected secciones = signal<SeccionDTO[]>([]);
  protected loading = signal(true);
  protected uploading = signal(false);
  protected error = signal<string | null>(null);

  protected descripcionCondicion = signal('');
  protected guardandoDescripcion = signal(false);

  protected seccionId = signal<number | null>(null);
  protected seccionCodigo = signal('');
  protected seccionTitulo = signal('');
  protected seccionOrden = signal(1);
  protected textoLineamiento = signal('');
  protected estadoSeccion = signal<EstadoSeccion>('BORRADOR');
  protected guardandoTexto = signal(false);
  protected guardandoSeccion = signal(false);
  protected revisandoIA = signal(false);
  protected iaResult = signal<IaRevisionResultDTO | null>(null);
  protected historial = signal<HistorialCambioDTO[]>([]);
  protected historialLoading = signal(false);

  // ── Recomendar texto IA — modal state ─────────────────────────────────────
  protected recomendarOpen = signal(false);
  protected recomendandoTexto = signal(false);
  protected recomendarError = signal<string | null>(null);
  protected recomendarResult = signal<RecomendarTextoResponse | null>(null);
  protected recomendarUserInstruction = signal('');
  protected copiadoFlash = signal(false);
  private copiadoFlashTimer: ReturnType<typeof setTimeout> | null = null;

  protected creandoSeccion = signal(false);
  protected nuevaSeccionCodigo = signal('');
  protected nuevaSeccionTitulo = signal('');

  protected seccionActiva = computed(() =>
    this.secciones().find(seccion => seccion.id === this.seccionId()) ?? null
  );

  protected historialCondicion = computed(() =>
    this.historial()
      .filter(item => item.condicionNumero === this.numeroLineamiento())
      .slice(0, 8)
  );

  lineamientoId: number | null = null;

  protected readonly LINEAMIENTOS = LINEAMIENTOS_DECRETO_1330;

  ngOnInit(): void {
    const programaId =
      this.route.snapshot.paramMap.get('programaId') ??
      this.route.snapshot.paramMap.get('id');
    const numeroLineamiento =
      this.route.snapshot.paramMap.get('numero') ??
      this.route.snapshot.paramMap.get('lineamiento');

    if (!programaId || !numeroLineamiento) {
      this.error.set('Parametros invalidos');
      this.loading.set(false);
      return;
    }

    const programaIdNum = +programaId;
    const numeroLinNum = +numeroLineamiento;
    this.numeroLineamiento.set(numeroLinNum);
    this.prepareNewSectionDefaults();
    this.loadPrograma(programaIdNum);
    this.loadLineamientoData(programaIdNum, numeroLinNum);
  }

  private loadPrograma(id: number): void {
    this.programaService.getPrograma(id).subscribe({
      next: (data) => this.programa.set(data),
      error: () => {
        this.error.set('No se pudo cargar el programa');
        this.loading.set(false);
      }
    });
  }

  private loadLineamientoData(programaId: number, numeroLineamiento: number): void {
    this.lineamientoService.getLineamientos(programaId).subscribe({
      next: (lineamientos) => {
        const lin = lineamientos.find(l => l.numero === numeroLineamiento);
        if (!lin) {
          this.error.set('No se encontro la condicion solicitada');
          this.loading.set(false);
          return;
        }
        this.lineamientoActual.set(lin);
        this.descripcionCondicion.set(lin.descripcion ?? '');
        this.lineamientoId = lin.id;
        this.loadEvidencias(lin.id);
        this.loadSecciones(lin.id);
        this.loadHistorial(programaId);
      },
      error: () => {
        this.error.set('No se pudo cargar la condicion');
        this.loading.set(false);
      }
    });
  }

  private loadHistorial(programaId?: number): void {
    const id = programaId ?? this.programa()?.id;
    if (!id) {
      this.historial.set([]);
      return;
    }

    this.historialLoading.set(true);
    this.historialCambioService.listar(id).subscribe({
      next: (items) => {
        this.historial.set(items);
        this.historialLoading.set(false);
      },
      error: () => {
        this.historial.set([]);
        this.historialLoading.set(false);
      }
    });
  }

  private loadSecciones(lineamientoId: number, preferredId?: number): void {
    this.seccionService.getByLineamiento(lineamientoId).subscribe({
      next: (secciones) => {
        const sorted = this.sortSecciones(secciones);
        this.secciones.set(sorted);
        const selected = sorted.find(sec => sec.id === preferredId) ?? sorted[0] ?? null;
        if (selected) {
          this.seleccionarSeccion(selected);
        }
        this.prepareNewSectionDefaults();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las secciones');
        this.loading.set(false);
      }
    });
  }

  private loadEvidencias(lineamientoId: number): void {
    this.evidenciaService.getEvidenciasByLineamiento(lineamientoId).subscribe({
      next: (data) => this.evidencias.set(data),
      error: (err) => console.error('Error loading evidencias:', err)
    });
  }

  seleccionarSeccion(seccion: SeccionDTO): void {
    this.seccionId.set(seccion.id);
    this.seccionCodigo.set(seccion.codigoSeccion ?? '');
    this.seccionTitulo.set(seccion.titulo ?? '');
    this.seccionOrden.set(seccion.orden ?? 1);
    this.textoLineamiento.set(seccion.contenidoRedactado ?? '');
    this.estadoSeccion.set(seccion.estado);
    this.iaResult.set(null);
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
            this.loadHistorial();
            input.value = '';
          }
        },
        error: () => {
          completed++;
          if (completed === files.length) {
            this.uploading.set(false);
            alert('Error al subir algunos archivos');
          }
        }
      });
    });
  }

  onDescripcionInput(event: Event): void {
    this.descripcionCondicion.set((event.target as HTMLTextAreaElement).value);
  }

  onGuardarDescripcion(): void {
    if (!this.lineamientoId) return;

    this.guardandoDescripcion.set(true);
    this.lineamientoService.updateLineamiento(this.lineamientoId, {
      descripcion: this.descripcionCondicion()
    }).subscribe({
      next: (lin) => {
        this.lineamientoActual.set(lin);
        this.descripcionCondicion.set(lin.descripcion ?? '');
        this.loadHistorial();
        this.guardandoDescripcion.set(false);
      },
      error: () => {
        alert('No fue posible guardar la descripcion.');
        this.guardandoDescripcion.set(false);
      }
    });
  }

  onTextareaInput(event: Event): void {
    this.textoLineamiento.set((event.target as HTMLTextAreaElement).value);
  }

  onSeccionCodigoInput(event: Event): void {
    this.seccionCodigo.set((event.target as HTMLInputElement).value);
  }

  onSeccionTituloInput(event: Event): void {
    this.seccionTitulo.set((event.target as HTMLInputElement).value);
  }

  onSeccionOrdenInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.seccionOrden.set(Number.isFinite(value) && value > 0 ? value : 1);
  }

  toggleCrearSeccion(): void {
    this.creandoSeccion.update(value => !value);
    this.prepareNewSectionDefaults();
  }

  onNuevaSeccionCodigoInput(event: Event): void {
    this.nuevaSeccionCodigo.set((event.target as HTMLInputElement).value);
  }

  onNuevaSeccionTituloInput(event: Event): void {
    this.nuevaSeccionTitulo.set((event.target as HTMLInputElement).value);
  }

  onCrearSeccion(): void {
    if (!this.lineamientoId) return;
    const codigoSeccion = this.nuevaSeccionCodigo().trim();
    const titulo = this.nuevaSeccionTitulo().trim();
    if (!codigoSeccion || !titulo) {
      alert('Codigo y titulo son obligatorios.');
      return;
    }

    this.guardandoSeccion.set(true);
    this.seccionService.crear(this.lineamientoId, {
      codigoSeccion,
      titulo,
      orden: this.nextOrden()
    }).subscribe({
      next: (created) => {
        this.replaceSeccion(created);
        this.seleccionarSeccion(created);
        this.creandoSeccion.set(false);
        this.prepareNewSectionDefaults();
        this.loadHistorial();
        this.guardandoSeccion.set(false);
      },
      error: () => {
        alert('No fue posible crear la seccion.');
        this.guardandoSeccion.set(false);
      }
    });
  }

  onGuardarContenido(): void {
    this.guardandoTexto.set(true);
    this.persistActiveSection('EN_REVISION').subscribe({
      next: (sec) => {
        this.replaceSeccion(sec);
        this.seleccionarSeccion(sec);
        this.loadHistorial();
        this.guardandoTexto.set(false);
      },
      error: () => {
        alert('No fue posible guardar la seccion.');
        this.guardandoTexto.set(false);
      }
    });
  }

  onRevisarConIA(): void {
    if (!this.lineamientoId || !this.textoLineamiento().trim()) return;

    this.revisandoIA.set(true);
    this.persistActiveSection('EN_REVISION').pipe(
      switchMap(sec => {
        this.replaceSeccion(sec);
        this.seleccionarSeccion(sec);
        return this.seccionService.revisarConIA(sec.id);
      })
    ).subscribe({
      next: (result) => {
        this.iaResult.set(result);
        this.revisandoIA.set(false);
      },
      error: () => {
        alert('No fue posible obtener la revision de la IA.');
        this.revisandoIA.set(false);
      }
    });
  }

  onEliminarSeccion(): void {
    const active = this.seccionActiva();
    if (!active || !this.lineamientoId || this.secciones().length <= 1) return;
    if (!confirm('Eliminar esta seccion?')) return;

    this.guardandoSeccion.set(true);
    this.seccionService.eliminar(active.id).subscribe({
      next: () => {
        const remaining = this.secciones().filter(sec => sec.id !== active.id);
        this.secciones.set(remaining);
        if (remaining.length > 0) {
          this.seleccionarSeccion(remaining[0]);
        }
        this.prepareNewSectionDefaults();
        this.loadHistorial();
        this.guardandoSeccion.set(false);
      },
      error: () => {
        alert('No fue posible eliminar la seccion.');
        this.guardandoSeccion.set(false);
      }
    });
  }

  private persistActiveSection(estado: EstadoSeccion) {
    if (!this.lineamientoId) {
      throw new Error('Lineamiento no disponible');
    }

    const payload: ActualizarSeccionRequest = {
      codigoSeccion: this.seccionCodigo().trim(),
      titulo: this.seccionTitulo().trim(),
      orden: this.seccionOrden(),
      contenidoRedactado: this.textoLineamiento(),
      observaciones: this.seccionActiva()?.observaciones ?? '',
      estado
    };

    const id = this.seccionId();
    return id
      ? this.seccionService.actualizar(id, payload)
      : this.seccionService.guardar(this.lineamientoId, payload);
  }

  private replaceSeccion(seccion: SeccionDTO): void {
    const next = this.secciones().some(sec => sec.id === seccion.id)
      ? this.secciones().map(sec => sec.id === seccion.id ? seccion : sec)
      : [...this.secciones(), seccion];
    this.secciones.set(this.sortSecciones(next));
  }

  private sortSecciones(secciones: SeccionDTO[]): SeccionDTO[] {
    return [...secciones].sort((a, b) =>
      (a.orden ?? Number.MAX_SAFE_INTEGER) - (b.orden ?? Number.MAX_SAFE_INTEGER) ||
      a.codigoSeccion.localeCompare(b.codigoSeccion)
    );
  }

  private nextOrden(): number {
    return this.secciones().reduce((max, sec) => Math.max(max, sec.orden ?? 0), 0) + 1;
  }

  private prepareNewSectionDefaults(): void {
    const next = this.secciones().length + 1;
    this.nuevaSeccionCodigo.set(`L${this.numeroLineamiento()}.${next}`);
    this.nuevaSeccionTitulo.set('Nueva seccion');
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
      error: () => alert('Error al descargar')
    });
  }

  deleteEvidencia(id: number): void {
    if (!confirm('Eliminar esta evidencia?')) return;
    this.evidenciaService.deleteEvidencia(id).subscribe({
      next: () => {
        if (this.lineamientoId) this.loadEvidencias(this.lineamientoId);
        this.loadHistorial();
      },
      error: () => alert('Error al eliminar')
    });
  }

  canDeleteEvidencia(): boolean {
    return this.authService.hasPermission('DELETE_EVIDENCIA');
  }

  canDeleteSeccion(): boolean {
    return this.authService.hasPermission('DELETE_SECCION');
  }

  labelAccion(accion: string): string {
    const labels: Record<string, string> = {
      CREAR: 'Creo',
      ACTUALIZAR: 'Actualizo',
      ELIMINAR: 'Elimino',
      SUBIR: 'Subio'
    };
    return labels[accion] ?? accion;
  }

  formatHistoryDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getLineamientoNombre(): string {
    return this.lineamientoActual()?.nombre
      ?? this.LINEAMIENTOS.find(l => l.numero === this.numeroLineamiento())?.nombre
      ?? `Condicion ${this.numeroLineamiento()}`;
  }

  getLineamientoColor(): string {
    const lin = this.LINEAMIENTOS.find(l => l.numero === this.numeroLineamiento());
    return lin ? `linear-gradient(135deg, ${lin.color} 0%, #007b00 100%)` : 'linear-gradient(135deg, #006600 0%, #007b00 100%)';
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  shortenId(id: string | undefined): string {
    return id ? `chunk ${id.slice(0, 8)}` : 'chunk N/D';
  }

  formatUsd(value: number | undefined): string {
    return value === undefined || value === null ? 'N/D' : `$${value.toFixed(6)} USD`;
  }

  formatNumber(value: number | undefined): string {
    return value === undefined || value === null ? 'N/D' : value.toFixed(3);
  }

  getIaResultClass(): string {
    const result = this.iaResult();
    if (!result) return 'ia-result';
    if (result.insufficientContext || result.nivelRiesgo === 'SIN_CONTEXTO') return 'ia-result ia-result--sin-contexto';
    return `ia-result ia-result--${result.nivelRiesgo.toLowerCase()}`;
  }

  getRiskBadgeClass(): string {
    const result = this.iaResult();
    if (!result) return 'riesgo-badge';
    if (result.insufficientContext || result.nivelRiesgo === 'SIN_CONTEXTO') return 'riesgo-badge riesgo-sin-contexto';
    return `riesgo-badge riesgo-${result.nivelRiesgo.toLowerCase()}`;
  }

  formatPageRange(pageStart: number | undefined, pageEnd: number | undefined): string {
    if (!pageStart) return 'Pag. N/D';
    return pageEnd && pageEnd !== pageStart ? `Pag. ${pageStart}-${pageEnd}` : `Pag. ${pageStart}`;
  }

  goBack(): void {
    this.router.navigate(['/programas', this.programa()?.id]);
  }

  // ── Recomendar texto IA ───────────────────────────────────────────────────

  tituloRecomendar(): string {
    const tituloSec = this.seccionTitulo()?.trim() || this.seccionCodigo() || 'Seccion';
    return `Texto sugerido para ${tituloSec}`;
  }

  modoSugeridoLabel(): string {
    return this.detectarModo() === 'CREATE'
      ? 'Modo: crear desde cero'
      : 'Modo: mejorar contenido actual';
  }

  private detectarModo(): RecomendarTextoMode {
    return (this.textoLineamiento() || '').trim() ? 'IMPROVE' : 'CREATE';
  }

  /**
   * Heurística client-side: deshabilita el botón si el frontend no detecta
   * ningún elemento de contexto. La validación dura corre en el backend.
   */
  puedeRecomendarTexto(): boolean {
    if (!this.seccionTitulo().trim()) return false;
    const condicionDesc = (this.descripcionCondicion() || '').trim();
    const contenidoActual = (this.textoLineamiento() || '').trim();
    const tieneEvidencias = this.evidencias().length > 0;
    const tieneOtrasSecciones = this.secciones().some(
      s => s.id !== this.seccionId() && (s.contenidoRedactado ?? '').trim().length >= 30
    );
    const tienePrograma = !!this.programa()?.nombre?.trim();
    return (
      condicionDesc.length > 0 ||
      contenidoActual.length > 0 ||
      tieneEvidencias ||
      tieneOtrasSecciones ||
      tienePrograma
    );
  }

  abrirRecomendarTexto(): void {
    if (!this.seccionId() || !this.seccionTitulo().trim()) return;
    this.recomendarOpen.set(true);
    this.recomendarError.set(null);
    this.recomendarResult.set(null);
    this.recomendarUserInstruction.set('');
    this.copiadoFlash.set(false);
  }

  cerrarRecomendarTexto(): void {
    if (this.recomendandoTexto()) return;
    this.recomendarOpen.set(false);
    this.recomendandoTexto.set(false);
    if (this.copiadoFlashTimer) {
      clearTimeout(this.copiadoFlashTimer);
      this.copiadoFlashTimer = null;
    }
    this.copiadoFlash.set(false);
  }

  onRecomendarInstructionInput(event: Event): void {
    this.recomendarUserInstruction.set((event.target as HTMLInputElement).value);
  }

  ejecutarRecomendarTexto(): void {
    const id = this.seccionId();
    if (!id || this.recomendandoTexto()) return;

    this.recomendandoTexto.set(true);
    this.recomendarError.set(null);
    this.recomendarResult.set(null);

    this.seccionService.recomendarTextoIA(id, {
      mode: this.detectarModo(),
      userInstruction: this.recomendarUserInstruction().trim() || undefined
    }).subscribe({
      next: (resp) => {
        this.recomendarResult.set(resp);
        this.recomendandoTexto.set(false);
      },
      error: (err) => {
        this.recomendarError.set(this.describeRecomendarError(err));
        this.recomendandoTexto.set(false);
      }
    });
  }

  copiarSugerido(): void {
    const text = this.recomendarResult()?.suggestedText;
    if (!text) return;
    const finish = () => {
      this.copiadoFlash.set(true);
      if (this.copiadoFlashTimer) clearTimeout(this.copiadoFlashTimer);
      this.copiadoFlashTimer = setTimeout(() => this.copiadoFlash.set(false), 1800);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(finish).catch(() => alert('No fue posible copiar al portapapeles.'));
    } else {
      // Legacy fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); finish(); } catch { alert('No fue posible copiar.'); }
      textarea.remove();
    }
  }

  /**
   * Reemplaza el textarea con el texto sugerido. No persiste — el usuario debe
   * revisar y presionar "Guardar seccion" para confirmar.
   */
  insertarSugerido(): void {
    const text = this.recomendarResult()?.suggestedText;
    if (!text) return;
    this.textoLineamiento.set(text);
    this.cerrarRecomendarTexto();
  }

  private describeRecomendarError(err: unknown): string {
    if (err && typeof err === 'object' && 'status' in err) {
      const status = (err as { status?: number }).status;
      const body = (err as { error?: unknown }).error;
      const message =
        typeof body === 'object' && body !== null && 'error' in body
          ? String((body as { error?: string }).error ?? '')
          : typeof body === 'string'
            ? body
            : '';
      if (status === 0) return 'No se pudo contactar al servidor. Verifica tu conexion.';
      if (status === 400) return message || 'No hay contexto suficiente para generar una recomendacion.';
      if (status === 404) return 'La seccion no existe.';
      if (status === 422) return message || 'La solicitud no se pudo procesar con la informacion disponible.';
      if (status === 503) return message || 'El servicio IA no esta disponible temporalmente. Reintenta en unos minutos.';
      return message || `Error ${status} al generar la recomendacion.`;
    }
    return 'Ocurrio un error inesperado al generar la recomendacion.';
  }
}
