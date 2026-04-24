import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
          <h2>
            <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Error
          </h2>
          <p>{{ error() }}</p>
          <button class="btn btn-secondary" (click)="goBack()">Volver</button>
        </div>
      } @else if (programa()) {
        <!-- Header -->
        <div class="header-card">
          <div class="header-content">
            <button class="btn-back" (click)="goBack()">← Volver</button>
            <h1>{{ programa()!.nombre }}</h1>
            <div class="general-info">
              <div class="info-section">
                <div class="info-detail">
                  <span class="info-label">ID:</span>
                  <span class="info-value">{{ programa()!.id }}</span>
                </div>
                <div class="info-detail">
                  <span class="info-label">Nivel:</span>
                  <span class="info-value">{{ programa()!.nivel }}</span>
                </div>
                <div class="info-detail">
                  <span class="info-label">Modalidad:</span>
                  <span class="info-value">{{ programa()!.modalidad }}</span>
                </div>
                <div class="info-detail">
                  <span class="info-label">Código SNIES:</span>
                  <span class="info-value">{{ programa()!.codigoSnies || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-export" (click)="onExportarZip()" [disabled]="exportando()">
              @if (exportando()) {
                <svg class="btn-icon-svg spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Generando...
              } @else {
                <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Exportar ZIP
              }
            </button>
            <button class="btn btn-secondary" (click)="onEdit()">
              <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
              Editar
            </button>
            <button class="btn btn-danger" (click)="onDelete()">
              <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Eliminar
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="content-grid">
          <!-- Lineamientos del Decreto 1330 -->
          <div class="lineamientos-card">
            <div class="card-header">
              <h2>
                <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                Condiciones del Decreto 1330 de 2019
              </h2>
              <span class="lineamientos-count">9 condiciones</span>
            </div>
            <div class="card-body">
              <div class="lineamientos-grid">
                @for (lineamiento of LINEAMIENTOS; track lineamiento.numero) {
                  <button 
                    class="lineamiento-card"
                    (click)="verLineamiento(lineamiento.numero)"
                    [style.border-left-color]="lineamiento.color">
                    <div class="lineamiento-icon" [innerHTML]="getLineamientoIconoSvg(lineamiento.numero)"></div>
                    <div class="lineamiento-content">
                      <div class="lineamiento-numero">Condición {{ lineamiento.numero }}</div>
                      <div class="lineamiento-nombre">{{ lineamiento.nombre }}</div>
                    </div>
                    <div class="lineamiento-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </div>
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .header-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 1rem;
      padding: 0;
      margin-bottom: 2rem;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: stretch;
      overflow: hidden;
      min-height: 300px;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      padding: 2rem;
      padding-bottom: 0;
      min-width: 300px;
    }

    .header-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 2rem;
      align-items: stretch;
      justify-content: flex-start;
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
      font-size: 2.5rem;
      margin: 0.5rem 0 1rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .header-meta {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .general-info {
      margin-top: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .info-section {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
      padding: 2rem;
      flex: 1;
      align-content: center;
    }

    .info-detail {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-detail .info-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-detail .info-value {
      font-size: 1rem;
      color: white;
      font-weight: 600;
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
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      justify-content: center;
    }

    .btn-icon-svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .btn-export {
      background: #10b981;
      color: white;
      width: 100%;
    }

    .btn-export:hover:not(:disabled) {
      background: #059669;
    }

    .btn-export:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #667eea;
      width: 100%;
    }

    .btn-secondary:hover {
      background: #f0f0f0;
    }

    .btn-danger {
      background: #f44336;
      color: white;
      width: 100%;
    }

    .btn-danger:hover {
      background: #d32f2f;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .title-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
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
      min-width: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #667eea;
    }

    .lineamiento-icon svg {
      width: 30px;
      height: 30px;
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
      color: #667eea;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lineamiento-arrow svg {
      width: 18px;
      height: 18px;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .header-card {
        grid-template-columns: 1fr;
        min-height: auto;
      }

      .header-actions {
        flex-direction: row;
        padding: 1.5rem;
        padding-top: 0;
      }

      .info-section {
        grid-template-columns: repeat(2, 1fr);
        padding: 1.5rem;
      }

      h1 {
        font-size: 1.8rem;
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
  private sanitizer = inject(DomSanitizer);

  protected programa = signal<ProgramaDTO | null>(null);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected exportando = signal(false);

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

  onExportarZip(): void {
    if (!this.programa()) return;
    this.exportando.set(true);
    this.programaService.exportarZip(this.programa()!.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registro_calificado_${this.programa()!.id}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exportando.set(false);
      },
      error: (err) => {
        console.error('Error exportando ZIP:', err);
        alert('No se pudo generar el archivo ZIP.');
        this.exportando.set(false);
      }
    });
  }

  verLineamiento(numeroLineamiento: number): void {
    if (!this.programa()) return;
    this.router.navigate(['/programas', this.programa()!.id, 'lineamiento', numeroLineamiento]);
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
}
