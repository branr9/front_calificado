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
                      👁️
                    </button>
                    <button 
                      class="btn-action btn-edit" 
                      (click)="onEdit(programa.id)"
                      type="button"
                      [attr.aria-label]="'Editar programa ' + programa.nombre">
                      ✏️
                    </button>
                    <button 
                      class="btn-action btn-delete" 
                      (click)="onDelete(programa.id, programa.nombre)"
                      type="button"
                      [attr.aria-label]="'Eliminar programa ' + programa.nombre">
                      🗑️
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
      font-size: 1.2rem;
      transition: transform 0.2s ease;
    }

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
