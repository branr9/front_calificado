import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProgramaService } from '../../core/services/programa.service';
import { AuthService } from '../../core/services/auth.service';
import { ProgramaDTO } from '../../core/models/programa.model';

@Component({
  selector: 'app-programa-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <header class="header">
        <div>
          <h1>Programas Académicos</h1>
          <p class="subtitle">Gestiona todos los programas del sistema</p>
        </div>
        <button class="btn btn-primary" (click)="onCreate()" type="button">
          + Nuevo Programa
        </button>
      </header>

      @if (loading()) {
        <div class="loading">Cargando programas...</div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else {
        <div class="table-container">
          <table class="programs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Nivel</th>
                <th>Modalidad</th>
                <th>Código SNIES</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (programa of programas(); track programa.id) {
                <tr>
                  <td>{{ programa.id }}</td>
                  <td>{{ programa.nombre }}</td>
                  <td><span class="badge badge-nivel">{{ programa.nivel }}</span></td>
                  <td><span class="badge badge-modalidad">{{ programa.modalidad }}</span></td>
                  <td>{{ programa.codigoSnies || 'N/A' }}</td>
                  <td class="actions">
                    <button 
                      class="btn-action btn-view" 
                      (click)="onView(programa.id)"
                      type="button"
                      [attr.aria-label]="'Ver programa ' + programa.nombre">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button 
                      class="btn-action btn-edit" 
                      (click)="onEdit(programa.id)"
                      type="button"
                      [attr.aria-label]="'Editar programa ' + programa.nombre">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                    </button>
                    <button 
                      class="btn-action btn-delete" 
                      (click)="onDelete(programa.id, programa.nombre)"
                      type="button"
                      [attr.aria-label]="'Eliminar programa ' + programa.nombre">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty-state">
                    No hay programas registrados. ¡Crea el primero!
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
      background: white;
      padding: 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    h1 {
      color: #2c3e50;
      margin: 0 0 0.25rem 0;
      font-size: 1.8rem;
    }

    .subtitle {
      color: #7f8c8d;
      font-size: 0.95rem;
      margin: 0;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5568d3;
    }

    .table-container {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .programs-table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: #f5f5f5;
    }

    th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #555;
      border-bottom: 2px solid #e0e0e0;
    }

    td {
      padding: 1rem;
      border-bottom: 1px solid #f0f0f0;
    }

    tbody tr:hover {
      background: #f9f9f9;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .badge-nivel {
      background: #e3f2fd;
      color: #1976d2;
    }

    .badge-modalidad {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-action {
      padding: 0.5rem;
      border: none;
      background: transparent;
      cursor: pointer;
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }

    .btn-action svg {
      width: 18px;
      height: 18px;
    }

    .btn-view { color: #4b5563; }
    .btn-edit { color: #f97316; }
    .btn-delete { color: #9ca3af; }

    .btn-action:hover {
      transform: scale(1.2);
    }

    .loading, .error {
      text-align: center;
      padding: 3rem;
      font-size: 1.1rem;
    }

    .error {
      color: #d32f2f;
      background: #ffebee;
      border-radius: 0.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem !important;
      color: #999;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
      }

      .table-container {
        overflow-x: auto;
      }
    }
  `]
})
export class ProgramaListComponent implements OnInit {
  private programaService = inject(ProgramaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  protected programas = signal<ProgramaDTO[]>([]);
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProgramas();
  }

  loadProgramas(): void {
    this.loading.set(true);
    this.error.set(null);

    this.programaService.getProgramas().subscribe({
      next: (data) => {
        this.programas.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los programas. Verifica que el servidor esté activo.');
        this.loading.set(false);
        console.error('Error loading programas:', err);
      }
    });
  }

  onCreate(): void {
    this.router.navigate(['/programas/nuevo']);
  }

  onView(id: number): void {
    this.router.navigate(['/programas', id]);
  }

  onEdit(id: number): void {
    this.router.navigate(['/programas/editar', id]);
  }

  onDelete(id: number, nombre: string): void {
    if (confirm(`¿Estás seguro de eliminar el programa "${nombre}"?`)) {
      this.programaService.deletePrograma(id).subscribe({
        next: () => {
          this.loadProgramas();
        },
        error: (err) => {
          alert('Error al eliminar el programa');
          console.error('Error deleting programa:', err);
        }
      });
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}
