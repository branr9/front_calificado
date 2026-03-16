import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  EstadoDocumentoRegistro,
  LINEAMIENTOS_DECRETO_1330,
  LineamientoDTO,
  ProgresoRegistroDTO
} from '../../core/models/lineamiento.model';
import { ProgramaDTO } from '../../core/models/programa.model';
import { LineamientoService } from '../../core/services/lineamiento.service';
import { ProgramaService } from '../../core/services/programa.service';

interface LineamientoEstado {
  numero: number;
  nombre: string;
  icono: string;
  color: string;
  porcentaje: number;
}

interface ProgramaResumen {
  id: number;
  nombre: string;
  completados: number;
  enProgreso: number;
  noIniciados: number;
  porcentajeTotal: number;
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <!-- Header con gradiente -->
      <header class="dashboard-header">
        <div class="header-content">
          <div>
            <h1>Dashboard - Registro Calificado</h1>
            <p class="subtitle">Decreto 1330 de 2019 - Seguimiento de cumplimiento</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-outline" (click)="verDocumentoFinal()" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Ver Documento Final
            </button>
          </div>
        </div>
      </header>

      <div class="section selector-section">
        <div class="selector-card">
          <div class="selector-info">
            <div class="selector-title">Programa seleccionado</div>
            <div class="selector-subtitle">Las métricas superiores se calculan sobre este programa</div>
          </div>
          <select
            class="programa-select"
            [value]="programaSeleccionadoId() ?? ''"
            (change)="seleccionarPrograma($event)">
            @if (programas().length === 0) {
              <option value="">No hay programas registrados</option>
            }
            @for (programa of programas(); track programa.id) {
              <option [value]="programa.id">{{ programa.nombre }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Métricas principales -->
      <div class="metrics-grid">
        <div class="metric-card completados">
          <div class="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="metric-content">
            <div class="metric-label">COMPLETADOS</div>
            <div class="metric-value">{{ completados() }}</div>
          </div>
        </div>

        <div class="metric-card en-progreso">
          <div class="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="metric-content">
            <div class="metric-label">EN PROGRESO</div>
            <div class="metric-value">{{ enProgreso() }}</div>
          </div>
        </div>

        <div class="metric-card no-iniciados">
          <div class="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </div>
          <div class="metric-content">
            <div class="metric-label">NO INICIADOS</div>
            <div class="metric-value">{{ noIniciados() }}</div>
          </div>
        </div>
      </div>

      <!-- Progreso Total -->
      <div class="progress-card">
        <div class="progress-circle">
          <div class="circle">
            <div class="circle-text">
              <span class="percentage">{{ progresoTotal() }}%</span>
            </div>
          </div>
        </div>
        <div class="progress-info">
          <div class="progress-title">PROGRESO TOTAL</div>
          <div class="progress-subtitle">{{ nombreProgramaSeleccionado() }}</div>
        </div>
      </div>

      <!-- Progreso General de Cumplimiento -->
      <div class="section">
        <h2 class="section-title">Progreso General de Cumplimiento</h2>
        <div class="progress-bars">
          @for (lineamiento of lineamientos(); track lineamiento.numero) {
            <div class="lineamiento-progress">
              <div class="lineamiento-header">
                <span class="lineamiento-icon" [innerHTML]="getIconoSvg(lineamiento.numero)"></span>
                <span class="lineamiento-nombre">{{ lineamiento.nombre }}</span>
                <span class="lineamiento-porcentaje">{{ lineamiento.porcentaje }}%</span>
              </div>
              <div class="progress-bar-container">
                <div 
                  class="progress-bar-fill" 
                  [style.width.%]="lineamiento.porcentaje"
                  [style.background]="lineamiento.color">
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Estado de Lineamientos -->
      <div class="section">
        <h2 class="section-title">Estado de Lineamientos</h2>
        <div class="lineamientos-grid">
          @for (lineamiento of lineamientos(); track lineamiento.numero) {
            <div 
              class="lineamiento-card"
              [class.completado]="lineamiento.porcentaje === 100"
              (click)="irALineamiento(lineamiento.numero)">
              <div class="card-icon" [style.background]="lineamiento.color" [innerHTML]="getIconoSvg(lineamiento.numero)"></div>
              <div class="card-content">
                <div class="card-numero">Lineamiento {{ lineamiento.numero }}</div>
                <div class="card-nombre">{{ lineamiento.nombre }}</div>
                <div class="card-status">
                  <span class="status-badge" [class.active]="lineamiento.porcentaje > 0">
                    {{ getEstado(lineamiento.porcentaje) }}
                  </span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Avance Individual por Programa</h2>
        <div class="programas-resumen">
          @for (resumen of resumenProgramas(); track resumen.id) {
            <div class="programa-item">
              <div class="programa-header">
                <div class="programa-nombre">{{ resumen.nombre }}</div>
                <div class="programa-porcentaje">{{ resumen.porcentajeTotal }}%</div>
              </div>
              <div class="programa-barra">
                <div class="programa-barra-fill" [style.width.%]="resumen.porcentajeTotal"></div>
              </div>
              <div class="programa-detalles">
                <span>Completados: {{ resumen.completados }}</span>
                <span>En progreso: {{ resumen.enProgreso }}</span>
                <span>No iniciados: {{ resumen.noIniciados }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <div class="section">
        <div class="institucional-card">
          <div>
            <div class="institucional-label">PROMEDIO INSTITUCIONAL</div>
            <div class="institucional-subtitle">Promedio de avance de {{ totalProgramas() }} programas</div>
          </div>
          <div class="institucional-value">{{ promedioInstitucional() }}%</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background: #f0f2f7;
    }

    .dashboard-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2.5rem 3rem;
      margin-bottom: 2rem;
      border-radius: 0 0 2rem 2rem;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    h1 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
    }

    .subtitle {
      font-size: 1rem;
      opacity: 0.95;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.875rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-outline {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      backdrop-filter: blur(10px);
    }

    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
    }

    .btn-primary {
      background: white;
      color: #667eea;
    }

    .btn-primary:hover {
      background: #f8f9fb;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .metrics-grid {
      max-width: 1400px;
      margin: 0 auto 2rem;
      padding: 0 3rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .selector-section {
      margin-bottom: 2rem;
    }

    .selector-card {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .selector-title {
      font-size: 1rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }

    .selector-subtitle {
      font-size: 0.9rem;
      color: #7f8c8d;
    }

    .programa-select {
      min-width: 280px;
      border: 1px solid #d5dae0;
      border-radius: 0.6rem;
      padding: 0.65rem 0.8rem;
      font-size: 0.95rem;
      color: #2c3e50;
      background: white;
    }

    .metric-card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }

    .metric-card.completados {
      border-left: 5px solid #9b59b6;
    }

    .metric-card.en-progreso {
      border-left: 5px solid #f39c12;
    }

    .metric-card.no-iniciados {
      border-left: 5px solid #95a5a6;
    }

    .metric-icon {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .metric-icon svg {
      width: 36px;
      height: 36px;
    }

    .metric-card.completados .metric-icon { color: #9b59b6; }
    .metric-card.en-progreso .metric-icon { color: #f39c12; }
    .metric-card.no-iniciados .metric-icon { color: #95a5a6; }

    .metric-content {
      flex: 1;
    }

    .metric-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #7f8c8d;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2c3e50;
    }

    .progress-card {
      max-width: 1400px;
      margin: 0 auto 3rem;
      padding: 0 3rem;
    }

    .progress-card > div {
      background: white;
      border-radius: 1rem;
      padding: 2.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .progress-circle {
      flex-shrink: 0;
    }

    .circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .circle-text {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .percentage {
      font-size: 2rem;
      font-weight: 700;
      color: #667eea;
    }

    .progress-info {
      flex: 1;
    }

    .progress-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }

    .progress-subtitle {
      font-size: 1rem;
      color: #7f8c8d;
    }

    .section {
      max-width: 1400px;
      margin: 0 auto 3rem;
      padding: 0 3rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 1.5rem;
    }

    .progress-bars {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    }

    .lineamiento-progress {
      margin-bottom: 1.5rem;
    }

    .lineamiento-progress:last-child {
      margin-bottom: 0;
    }

    .lineamiento-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .lineamiento-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #667eea;
    }

    .lineamiento-icon svg {
      width: 22px;
      height: 22px;
    }

    .lineamiento-nombre {
      flex: 1;
      font-weight: 600;
      color: #2c3e50;
    }

    .lineamiento-porcentaje {
      font-weight: 700;
      color: #667eea;
    }

    .progress-bar-container {
      height: 8px;
      background: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      transition: width 0.5s ease;
      border-radius: 4px;
    }

    .lineamientos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .programas-resumen {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      display: grid;
      gap: 1rem;
    }

    .programa-item {
      border: 1px solid #edf1f5;
      border-radius: 0.8rem;
      padding: 1rem;
    }

    .programa-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      gap: 1rem;
    }

    .programa-nombre {
      font-weight: 600;
      color: #2c3e50;
    }

    .programa-porcentaje {
      font-weight: 700;
      color: #667eea;
    }

    .programa-barra {
      background: #ecf0f1;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.6rem;
    }

    .programa-barra-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.4s ease;
      border-radius: 4px;
    }

    .programa-detalles {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 0.85rem;
      color: #607080;
    }

    .institucional-card {
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      border-radius: 1rem;
      color: white;
      padding: 1.5rem 2rem;
      box-shadow: 0 8px 20px rgba(44, 62, 80, 0.24);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .institucional-label {
      font-size: 0.85rem;
      font-weight: 700;
      opacity: 0.9;
      letter-spacing: 0.5px;
      margin-bottom: 0.35rem;
    }

    .institucional-subtitle {
      font-size: 0.95rem;
      opacity: 0.9;
    }

    .institucional-value {
      font-size: 2.4rem;
      font-weight: 700;
    }

    .lineamiento-card {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .lineamiento-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }

    .lineamiento-card.completado {
      border: 2px solid #27ae60;
    }

    .card-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      color: white;
    }

    .card-icon svg {
      width: 28px;
      height: 28px;
    }

    .card-numero {
      font-size: 0.75rem;
      font-weight: 700;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }

    .card-nombre {
      font-size: 1rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.75rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      background: #ecf0f1;
      color: #7f8c8d;
    }

    .status-badge.active {
      background: #d4edda;
      color: #155724;
    }

    @media (max-width: 768px) {
      .dashboard-header,
      .metrics-grid,
      .progress-card,
      .section {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .lineamientos-grid {
        grid-template-columns: 1fr;
      }

      .programa-select {
        width: 100%;
        min-width: 0;
      }

      .institucional-value {
        font-size: 2rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private programaService = inject(ProgramaService);
  private lineamientoService = inject(LineamientoService);

  protected completados = signal(0);
  protected enProgreso = signal(0);
  protected noIniciados = signal(0);
  protected progresoTotal = signal(0);
  protected promedioInstitucional = signal(0);
  protected totalProgramas = signal(0);
  protected programas = signal<ProgramaDTO[]>([]);
  protected programaSeleccionadoId = signal<number | null>(null);
  protected resumenProgramas = signal<ProgramaResumen[]>([]);

  protected lineamientos = signal<LineamientoEstado[]>(LINEAMIENTOS_DECRETO_1330.map(l => ({
    ...l,
    porcentaje: 0
  })));

  ngOnInit(): void {
    this.cargarDashboard();
  }

  verDocumentoFinal(): void {
    this.router.navigate(['/documento-final']);
  }

  irALineamiento(numero: number): void {
    const programaId = this.programaSeleccionadoId();
    if (programaId) {
      this.router.navigate(['/programas', programaId, 'lineamiento', numero]);
      return;
    }

    this.router.navigate(['/lineamientos', numero]);
  }

  seleccionarPrograma(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const programaId = Number(select.value);

    if (!Number.isNaN(programaId) && programaId > 0) {
      this.programaSeleccionadoId.set(programaId);
      this.cargarDatosPrograma(programaId);
    }
  }

  getEstado(porcentaje: number): string {
    if (porcentaje === 0) return 'No iniciado';
    if (porcentaje < 100) return 'En progreso';
    return 'Completado';
  }

  getIconoSvg(numero: number): SafeHtml {
    const iconos: Record<number, string> = {
      1: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
      2: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
      3: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      4: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      5: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>`,
      6: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      7: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
      8: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
      9: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    };
    return this.sanitizer.bypassSecurityTrustHtml(iconos[numero] ?? iconos[1]);
  }

  nombreProgramaSeleccionado(): string {
    const id = this.programaSeleccionadoId();
    if (!id) {
      return 'Sin programa seleccionado';
    }

    return this.programas().find(programa => programa.id === id)?.nombre ?? 'Programa no encontrado';
  }

  private cargarDashboard(): void {
    this.programaService.getProgramas().subscribe({
      next: (programas) => {
        this.programas.set(programas);
        this.totalProgramas.set(programas.length);

        if (programas.length === 0) {
          this.actualizarProgresoPrograma(null, null);
          this.resumenProgramas.set([]);
          this.promedioInstitucional.set(0);
          return;
        }

        const progresoRequests = programas.map((programa) =>
          this.lineamientoService.getProgreso(programa.id).pipe(
            catchError(() => of(this.progresoVacio(programa.id)))
          )
        );

        forkJoin(progresoRequests).subscribe((progresos) => {
          const resumen = programas.map((programa, index) =>
            this.construirResumenPrograma(programa, progresos[index])
          );

          this.resumenProgramas.set(resumen);

          const promedio = Math.round(
            resumen.reduce((total, item) => total + item.porcentajeTotal, 0) / resumen.length
          );
          this.promedioInstitucional.set(promedio);

          const programaInicialId = programas[0].id;
          this.programaSeleccionadoId.set(programaInicialId);
          this.cargarDatosPrograma(programaInicialId);
        });
      },
      error: () => {
        this.actualizarProgresoPrograma(null, null);
        this.resumenProgramas.set([]);
        this.promedioInstitucional.set(0);
      }
    });
  }

  private cargarDatosPrograma(programaId: number): void {
    forkJoin({
      progreso: this.lineamientoService.getProgreso(programaId).pipe(
        catchError(() => of(this.progresoVacio(programaId)))
      ),
      lineamientos: this.lineamientoService.getLineamientos(programaId).pipe(
        catchError(() => of([] as LineamientoDTO[]))
      )
    }).subscribe(({ progreso, lineamientos }) => {
      this.actualizarProgresoPrograma(programaId, progreso);
      this.actualizarLineamientos(lineamientos);
      this.actualizarResumenPrograma(programaId, progreso);
      this.actualizarPromedioInstitucional();
    });
  }

  private actualizarProgresoPrograma(programaId: number | null, progreso: ProgresoRegistroDTO | null): void {
    this.programaSeleccionadoId.set(programaId);
    this.completados.set(progreso?.lineamientosCompletados ?? 0);
    this.enProgreso.set(progreso?.lineamientosEnProgreso ?? 0);
    this.noIniciados.set(progreso?.lineamientosNoIniciados ?? 0);
    this.progresoTotal.set(progreso?.porcentajeTotal ?? 0);
  }

  private actualizarLineamientos(lineamientosPrograma: LineamientoDTO[]): void {
    this.lineamientos.set(
      LINEAMIENTOS_DECRETO_1330.map((base) => {
        const lineamiento = lineamientosPrograma.find((item) => item.numero === base.numero);
        return {
          ...base,
          porcentaje: lineamiento?.porcentaje ?? 0
        };
      })
    );
  }

  private actualizarResumenPrograma(programaId: number, progreso: ProgresoRegistroDTO): void {
    const nombre = this.programas().find((programa) => programa.id === programaId)?.nombre ?? `Programa ${programaId}`;

    const actualizado = this.resumenProgramas().map((resumen) =>
      resumen.id === programaId
        ? {
            id: programaId,
            nombre,
            completados: progreso.lineamientosCompletados,
            enProgreso: progreso.lineamientosEnProgreso,
            noIniciados: progreso.lineamientosNoIniciados,
            porcentajeTotal: progreso.porcentajeTotal
          }
        : resumen
    );

    this.resumenProgramas.set(actualizado);
  }

  private actualizarPromedioInstitucional(): void {
    const resumen = this.resumenProgramas();
    if (resumen.length === 0) {
      this.promedioInstitucional.set(0);
      return;
    }

    const promedio = Math.round(
      resumen.reduce((total, item) => total + item.porcentajeTotal, 0) / resumen.length
    );
    this.promedioInstitucional.set(promedio);
  }

  private construirResumenPrograma(programa: ProgramaDTO, progreso: ProgresoRegistroDTO): ProgramaResumen {
    return {
      id: programa.id,
      nombre: programa.nombre,
      completados: progreso.lineamientosCompletados,
      enProgreso: progreso.lineamientosEnProgreso,
      noIniciados: progreso.lineamientosNoIniciados,
      porcentajeTotal: progreso.porcentajeTotal
    };
  }

  private progresoVacio(programaId: number): ProgresoRegistroDTO {
    return {
      programaId,
      lineamientosCompletados: 0,
      lineamientosEnProgreso: 0,
      lineamientosNoIniciados: LINEAMIENTOS_DECRETO_1330.length,
      porcentajeTotal: 0,
      palabrasDocumento: 0,
      estadoDocumento: EstadoDocumentoRegistro.BORRADOR
    };
  }
}
