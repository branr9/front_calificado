import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LINEAMIENTOS_DECRETO_1330 } from '../../core/models/lineamiento.model';

interface LineamientoEstado {
  numero: number;
  nombre: string;
  icono: string;
  color: string;
  porcentaje: number;
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
              📄 Ver Documento Final
            </button>
            <button class="btn btn-primary" (click)="gestionarDepartamentos()" type="button">
              🏢 Gestionar Departamentos
            </button>
          </div>
        </div>
      </header>

      <!-- Métricas principales -->
      <div class="metrics-grid">
        <div class="metric-card completados">
          <div class="metric-icon">✅</div>
          <div class="metric-content">
            <div class="metric-label">COMPLETADOS</div>
            <div class="metric-value">{{ completados() }}</div>
          </div>
        </div>

        <div class="metric-card en-progreso">
          <div class="metric-icon">⏳</div>
          <div class="metric-content">
            <div class="metric-label">EN PROGRESO</div>
            <div class="metric-value">{{ enProgreso() }}</div>
          </div>
        </div>

        <div class="metric-card no-iniciados">
          <div class="metric-icon">⭕</div>
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
          <div class="progress-subtitle">de cumplimiento</div>
        </div>
      </div>

      <!-- Progreso General de Cumplimiento -->
      <div class="section">
        <h2 class="section-title">Progreso General de Cumplimiento</h2>
        <div class="progress-bars">
          @for (lineamiento of lineamientos; track lineamiento.numero) {
            <div class="lineamiento-progress">
              <div class="lineamiento-header">
                <span class="lineamiento-icon">{{ lineamiento.icono }}</span>
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
          @for (lineamiento of lineamientos; track lineamiento.numero) {
            <div 
              class="lineamiento-card"
              [class.completado]="lineamiento.porcentaje === 100"
              (click)="irALineamiento(lineamiento.numero)">
              <div class="card-icon" [style.background]="lineamiento.color">
                {{ lineamiento.icono }}
              </div>
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
      font-size: 3rem;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 50%;
    }

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
      font-size: 1.5rem;
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
      font-size: 2rem;
      margin-bottom: 1rem;
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
    }
  `]
})
export class DashboardComponent {
  private router = inject(Router);

  protected completados = signal(0);
  protected enProgreso = signal(0);
  protected noIniciados = signal(0);
  protected progresoTotal = signal(0);

  protected lineamientos: LineamientoEstado[] = LINEAMIENTOS_DECRETO_1330.map(l => ({
    ...l,
    porcentaje: 0
  }));

  verDocumentoFinal(): void {
    this.router.navigate(['/documento-final']);
  }

  gestionarDepartamentos(): void {
    this.router.navigate(['/departamentos']);
  }

  irALineamiento(numero: number): void {
    this.router.navigate(['/lineamientos', numero]);
  }

  getEstado(porcentaje: number): string {
    if (porcentaje === 0) return 'No iniciado';
    if (porcentaje < 100) return 'En progreso';
    return 'Completado';
  }
}
