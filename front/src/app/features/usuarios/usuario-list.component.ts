import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioDTO } from '../../core/models/usuario.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="container">
      <header class="header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p class="subtitle">Administra los usuarios del sistema</p>
        </div>
        <button class="btn btn-primary" (click)="onCreate()" type="button">
          + Nuevo Usuario
        </button>
      </header>

      @if (loading()) {
        <div class="loading">Cargando usuarios...</div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else {
        <div class="table-container">
          <table class="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Nombre Completo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (usuario of usuarios(); track usuario.id) {
                <tr>
                  <td>{{ usuario.id }}</td>
                  <td><strong>{{ usuario.username }}</strong></td>
                  <td>{{ usuario.email }}</td>
                  <td>{{ usuario.nombreCompleto }}</td>
                  <td><span class="badge badge-rol">{{ usuario.rol }}</span></td>
                  <td>
                    <span class="badge" [class.badge-activo]="usuario.activo" [class.badge-inactivo]="!usuario.activo">
                      {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="actions">
                    <button 
                      class="btn-action btn-edit" 
                      (click)="onEdit(usuario.id)"
                      type="button"
                      [attr.aria-label]="'Editar usuario ' + usuario.username">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                    </button>
                    <button 
                      class="btn-action btn-delete" 
                      (click)="onDelete(usuario.id, usuario.username)"
                      type="button"
                      [attr.aria-label]="'Eliminar usuario ' + usuario.username">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="empty-state">
                    No hay usuarios registrados. ¡Crea el primero!
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
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .header h1 {
      margin: 0;
      font-size: 1.75rem;
      color: #333;
    }

    .subtitle {
      margin: 0.5rem 0 0;
      color: #666;
      font-size: 0.95rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 600;
    }

    .btn-primary {
      background: #5b4cdb;
      color: white;
    }

    .btn-primary:hover {
      background: #4a3bb8;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(91, 76, 219, 0.3);
    }

    .loading {
      background: white;
      padding: 2rem;
      text-align: center;
      border-radius: 0.75rem;
      color: #666;
    }

    .error {
      background: #fee;
      border: 1px solid #fcc;
      color: #c33;
      padding: 1rem;
      border-radius: 0.75rem;
      margin-bottom: 1rem;
    }

    .table-container {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .usuarios-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    .usuarios-table th {
      background: #f5f5f5;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #e0e0e0;
    }

    .usuarios-table td {
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .usuarios-table tbody tr:hover {
      background: #fafafa;
    }

    .badge {
      display: inline-block;
      padding: 0.4rem 0.8rem;
      border-radius: 0.25rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .badge-rol {
      background: #e3f2fd;
      color: #1976d2;
    }

    .badge-activo {
      background: #e8f5e9;
      color: #388e3c;
    }

    .badge-inactivo {
      background: #ffebee;
      color: #d32f2f;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-action {
      width: 36px;
      height: 36px;
      padding: 0;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .btn-action svg {
      width: 18px;
      height: 18px;
      stroke-width: 2;
    }

    .btn-edit {
      color: #1976d2;
      background: rgba(25, 118, 210, 0.1);
    }

    .btn-edit:hover {
      background: rgba(25, 118, 210, 0.2);
    }

    .btn-delete {
      color: #d32f2f;
      background: rgba(211, 47, 47, 0.1);
    }

    .btn-delete:hover {
      background: rgba(211, 47, 47, 0.2);
    }

    .empty-state {
      text-align: center;
      color: #999;
      padding: 2rem !important;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
      }

      .container {
        padding: 1rem;
      }

      .usuarios-table {
        font-size: 0.85rem;
      }

      .usuarios-table th,
      .usuarios-table td {
        padding: 0.75rem 0.5rem;
      }
    }
  `]
})
export class UsuarioListComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  
  protected usuarios = signal<UsuarioDTO[]>([]);
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.loading.set(true);
    this.error.set(null);

    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los usuarios. Verifica que el servidor esté activo.');
        this.loading.set(false);
        console.error('Error loading usuarios:', err);
      }
    });
  }

  onCreate(): void {
    this.router.navigate(['/usuarios/nuevo']);
  }

  onEdit(id: number): void {
    this.router.navigate(['/usuarios/editar', id]);
  }

  onDelete(id: number, username: string): void {
    if (confirm(`¿Estás seguro de eliminar el usuario "${username}"?`)) {
      this.usuarioService.deleteUsuario(id).subscribe({
        next: () => {
          this.loadUsuarios();
        },
        error: (err) => {
          alert('Error al eliminar el usuario');
          console.error('Error deleting usuario:', err);
        }
      });
    }
  }
}
