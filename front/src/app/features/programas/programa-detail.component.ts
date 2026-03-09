import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { DocumentoBaseService } from '../../core/services/documento-base.service';
import { LineamientoService } from '../../core/services/lineamiento.service';
import { ProgramaDTO } from '../../core/models/programa.model';
import { DocumentoBaseDTO } from '../../core/models/evidencia.model';
import { LineamientoDTO, LINEAMIENTOS_DECRETO_1330 } from '../../core/models/lineamiento.model';

@Component({
  selector: 'app-programa-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <div class="container">
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando programa...</p>
        </div>
      } @else if (error()) {
        <div class="error-card">
          <h2>❌ Error</h2>
          <p>{{ error() }}</p>
          <button class="btn btn-secondary" (click)="goBack()">Volver</button>
        </div>
      } @else if (programa()) {
        <!-- Header -->
        <div class="header-card">
          <div class="header-content">
            <button class="btn-back" (click)="goBack()">← Volver</button>
            <h1>{{ programa()!.nombre }}</h1>
            <div class="header-meta">
              <span class="badge badge-nivel">{{ programa()!.nivel }}</span>
              <span class="badge badge-modalidad">{{ programa()!.modalidad }}</span>
              @if (programa()!.codigoSnies) {
                <span class="badge badge-snies">SNIES: {{ programa()!.codigoSnies }}</span>
              }
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="onEdit()">
              ✏️ Editar
            </button>
            <button class="btn btn-danger" (click)="onDelete()">
              🗑️ Eliminar
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="content-grid">
          <!-- Información General -->
          <div class="info-card">
            <div class="card-header">
              <h2>📋 Información General</h2>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="info-label">ID:</span>
                <span class="info-value">{{ programa()!.id }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value">{{ programa()!.nombre }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Nivel:</span>
                <span class="info-value">{{ programa()!.nivel }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Modalidad:</span>
                <span class="info-value">{{ programa()!.modalidad }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Código SNIES:</span>
                <span class="info-value">{{ programa()!.codigoSnies || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Lineamientos del Decreto 1330 -->
          <div class="lineamientos-card">
            <div class="card-header">
              <h2>📋 Lineamientos del Decreto 1330 de 2019</h2>
              <span class="lineamientos-count">9 lineamientos</span>
            </div>
            <div class="card-body">
              <div class="lineamientos-grid">
                @for (lineamiento of LINEAMIENTOS; track lineamiento.numero) {
                  <button 
                    class="lineamiento-card"
                    (click)="verLineamiento(lineamiento.numero)"
                    [style.border-left-color]="lineamiento.color">
                    <div class="lineamiento-icon">{{ lineamiento.icono }}</div>
                    <div class="lineamiento-content">
                      <div class="lineamiento-numero">Lineamiento {{ lineamiento.numero }}</div>
                      <div class="lineamiento-nombre">{{ lineamiento.nombre }}</div>
                    </div>
                    <div class="lineamiento-arrow">→</div>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
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
    }

    .header-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .header-content {
      flex: 1;
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

    h1 {
      font-size: 2rem;
      margin: 0 0 1rem;
      font-weight: 700;
    }

    .header-meta {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .badge {
      padding: 0.4rem 1rem;
      border-radius: 2rem;
      font-size: 0.85rem;
      font-weight: 600;
      display: inline-block;
    }

    .badge-nivel {
      background: rgba(255, 255, 255, 0.9);
      color: #667eea;
    }

    .badge-modalidad {
      background: rgba(255, 255, 255, 0.9);
      color: #764ba2;
    }

    .badge-snies {
      background: rgba(255, 255, 255, 0.9);
      color: #333;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .btn-secondary {
      background: white;
      color: #667eea;
    }

    .btn-secondary:hover {
      background: #f0f0f0;
    }

    .btn-danger {
      background: #f44336;
      color: white;
    }

    .btn-danger:hover {
      background: #d32f2f;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5568d3;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .info-card,
    .stats-card,
    .documents-card,
    .lineamientos-card {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .documents-card,
    .lineamientos-card {
      grid-column: 1 / -1;
    }

    .card-header {
      padding: 1.5rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-header h2 {
      margin: 0;
      font-size: 1.2rem;
      color: #333;
      font-weight: 700;
    }

    .doc-count {
      background: #667eea;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .card-body {
      padding: 1.5rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #666;
    }

    .info-value {
      color: #333;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .stat-item:last-child {
      border-bottom: none;
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: #667eea;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .doc-categories {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .doc-category {
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .category-header {
      background: #f8f9fa;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      border-bottom: 1px solid #e0e0e0;
    }

    .category-icon {
      font-size: 1.5rem;
    }

    .category-name {
      flex: 1;
      color: #333;
    }

    .category-count {
      background: #667eea;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.85rem;
    }

    .doc-list {
      padding: 0.5rem;
    }

    .doc-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 0.25rem;
      transition: background 0.2s ease;
    }

    .doc-item:hover {
      background: #f8f9fa;
    }

    .doc-icon {
      font-size: 1.2rem;
    }

    .doc-name {
      flex: 1;
      font-size: 0.9rem;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .doc-size {
      font-size: 0.85rem;
      color: #999;
    }

    .btn-icon {
      padding: 0.25rem 0.5rem;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      transition: transform 0.2s ease;
    }

    .btn-icon:hover {
      transform: scale(1.2);
    }

    .lineamientos-count {
      background: #667eea;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .lineamientos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .lineamiento-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: white;
      border: 2px solid #e0e0e0;
      border-left: 4px solid #667eea;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
    }

    .lineamiento-card:hover {
      border-color: #667eea;
      background: #f5f7ff;
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .lineamiento-icon {
      font-size: 2.5rem;
      min-width: 50px;
      text-align: center;
    }

    .lineamiento-content {
      flex: 1;
    }

    .lineamiento-numero {
      font-size: 0.75rem;
      color: #667eea;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }

    .lineamiento-nombre {
      font-weight: 600;
      color: #333;
      font-size: 0.95rem;
      line-height: 1.3;
    }

    .lineamiento-arrow {
      font-size: 1.5rem;
      color: #667eea;
      font-weight: bold;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .header-card {
        flex-direction: column;
      }

      .content-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProgramaDetailComponent implements OnInit {
  private programaService = inject(ProgramaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected programa = signal<ProgramaDTO | null>(null);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  protected readonly LINEAMIENTOS = LINEAMIENTOS_DECRETO_1330;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPrograma(+id);
    } else {
      this.error.set('ID de programa no válido');
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

  goBack(): void {
    this.router.navigate(['/programas']);
  }

  onEdit(): void {
    this.router.navigate(['/programas/editar', this.programa()?.id]);
  }

  onDelete(): void {
    if (!this.programa()) return;
    
    const confirmacion = confirm(
      `¿Estás seguro de eliminar el programa "${this.programa()!.nombre}"?\n\nEsta acción no se puede deshacer.`
    );
    
    if (confirmacion) {
      this.programaService.deletePrograma(this.programa()!.id).subscribe({
        next: () => {
          alert('Programa eliminado exitosamente');
          this.router.navigate(['/programas']);
        },
        error: (err) => {
          console.error('Error deleting programa:', err);
          alert('Error al eliminar el programa');
        }
      });
    }
  }

  verLineamiento(numeroLineamiento: number): void {
    if (!this.programa()) return;
    this.router.navigate(['/programas', this.programa()!.id, 'lineamiento', numeroLineamiento]);
  }
}
