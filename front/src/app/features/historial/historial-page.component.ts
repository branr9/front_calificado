import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { HistorialCambioDTO } from '../../core/models/historial-cambio.model';
import { ProgramaDTO } from '../../core/models/programa.model';
import { HistorialCambioService } from '../../core/services/historial-cambio.service';
import { ProgramaService } from '../../core/services/programa.service';

@Component({
  selector: 'app-historial-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div class="page">
      <header class="header">
        <div>
          <h1>Historial</h1>
          <p>Registro de cambios realizados en condiciones y evidencias.</p>
        </div>
        <select class="program-select" [value]="programaId() ?? ''" (change)="onProgramaChange($event)">
          <option value="">Todos los programas</option>
          @for (programa of programas(); track programa.id) {
            <option [value]="programa.id">{{ programa.nombre }}</option>
          }
        </select>
      </header>

      <section class="summary">
        <div>
          <span class="summary-label">Eventos</span>
          <strong>{{ items().length }}</strong>
        </div>
        <div>
          <span class="summary-label">Programa</span>
          <strong>{{ programaNombre() }}</strong>
        </div>
      </section>

      @if (loading()) {
        <div class="state">Cargando historial...</div>
      } @else if (error()) {
        <div class="state state-error">{{ error() }}</div>
      } @else {
        <section class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Accion</th>
                <th>Condicion</th>
                <th>Responsable</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.id) {
                <tr>
                  <td>{{ item.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <span class="action action-{{ item.accion.toLowerCase() }}">{{ labelAccion(item.accion) }}</span>
                    <span class="entity">{{ labelEntidad(item.entidad) }}</span>
                  </td>
                  <td>
                    <strong>{{ item.condicionNumero ? 'Condicion ' + item.condicionNumero : 'N/D' }}</strong>
                    <span>{{ item.seccionCodigo || item.condicionTitulo || item.programaNombre || 'Sin referencia' }}</span>
                  </td>
                  <td>
                    <strong>{{ item.nombreCompleto || item.username }}</strong>
                    <span>{{ item.rol || item.username }}</span>
                  </td>
                  <td>{{ item.detalle || 'Sin detalle' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="empty">No hay cambios registrados.</td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      padding: 2rem;
      background: #f0f2f7;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      background: #fff;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 1rem;
    }

    h1 {
      margin: 0 0 0.35rem;
      color: #1f2937;
      font-size: 1.8rem;
    }

    p {
      margin: 0;
      color: #64748b;
    }

    .program-select {
      min-width: 280px;
      border: 1px solid #d5dae0;
      border-radius: 0.5rem;
      background: #fff;
      padding: 0.7rem 0.85rem;
      color: #1f2937;
      font-size: 0.95rem;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .summary > div {
      background: #fff;
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .summary-label {
      display: block;
      color: #64748b;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 0.35rem;
    }

    .summary strong {
      color: #1f2937;
      font-size: 1.05rem;
    }

    .table-wrap {
      background: #fff;
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      text-align: left;
      padding: 0.95rem 1rem;
      border-bottom: 1px solid #edf1f5;
      vertical-align: top;
    }

    th {
      background: #f8fafc;
      color: #475569;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    td {
      color: #263445;
      font-size: 0.92rem;
    }

    td span {
      display: block;
      color: #64748b;
      margin-top: 0.2rem;
    }

    .action {
      display: inline-block;
      border-radius: 999px;
      padding: 0.2rem 0.55rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 0.25rem;
    }

    .action-crear, .action-subir { background: #006600; }
    .action-actualizar { background: #0f766e; }
    .action-eliminar { background: #b91c1c; }
    .entity { font-size: 0.8rem; }

    .state {
      background: #fff;
      border-radius: 0.75rem;
      padding: 2rem;
      text-align: center;
      color: #64748b;
    }

    .state-error {
      color: #b91c1c;
      background: #fee2e2;
    }

    .empty {
      text-align: center;
      color: #64748b;
      padding: 2rem !important;
    }

    @media (max-width: 760px) {
      .page { padding: 1rem; }
      .program-select { width: 100%; min-width: 0; }
      .table-wrap { overflow-x: auto; }
      table { min-width: 780px; }
    }
  `]
})
export class HistorialPageComponent implements OnInit {
  private historialService = inject(HistorialCambioService);
  private programaService = inject(ProgramaService);

  protected programas = signal<ProgramaDTO[]>([]);
  protected programaId = signal<number | null>(null);
  protected items = signal<HistorialCambioDTO[]>([]);
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  protected programaNombre = computed(() => {
    const id = this.programaId();
    if (id == null) return 'Todos';
    return this.programas().find(p => p.id === id)?.nombre ?? `Programa ${id}`;
  });

  ngOnInit(): void {
    this.programaService.getProgramas().pipe(
      catchError(() => of([] as ProgramaDTO[]))
    ).subscribe(programas => this.programas.set(programas));
    this.cargarHistorial();
  }

  onProgramaChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.programaId.set(value ? Number(value) : null);
    this.cargarHistorial();
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

  labelEntidad(entidad: string): string {
    const labels: Record<string, string> = {
      CONDICION: 'Condicion',
      SECCION: 'Seccion',
      EVIDENCIA: 'Evidencia'
    };
    return labels[entidad] ?? entidad;
  }

  private cargarHistorial(): void {
    this.loading.set(true);
    this.error.set(null);
    this.historialService.listar(this.programaId()).subscribe({
      next: items => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar el historial.');
        this.items.set([]);
        this.loading.set(false);
      }
    });
  }
}
