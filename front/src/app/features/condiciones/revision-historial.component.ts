import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  RevisionGeneralJobDTO,
  RevisionGeneralStatus
} from '../../core/models/revision-general.model';

@Component({
  selector: 'app-revision-historial',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <section class="historial">
      <div class="historial-head">
        <div>
          <h2 class="section-title">Historial de revisiones</h2>
          <p class="section-sub">
            Cada revisión general queda guardada. Haz clic en una para ver el detalle completo.
          </p>
        </div>
        <button class="btn-refresh" type="button" (click)="refresh.emit()" [disabled]="loading">
          <span [innerHTML]="refreshSvg()"></span>
          <span>{{ loading ? 'Actualizando…' : 'Actualizar' }}</span>
        </button>
      </div>

      @if (loading && items.length === 0) {
        <div class="empty muted">Cargando historial…</div>
      } @else if (items.length === 0) {
        <div class="empty">
          <span class="empty-icon" [innerHTML]="historySvg()"></span>
          <p>Aún no se ha ejecutado ninguna revisión general para este programa.</p>
        </div>
      } @else {
        <div class="items">
          @for (item of items; track item.requestId) {
            <button
              class="item"
              type="button"
              (click)="select.emit(item)"
              [class.completed]="item.status === 'COMPLETED'"
              [class.failed]="item.status === 'FAILED'"
              [class.in-progress]="item.status === 'PENDING' || item.status === 'RUNNING'">
              <div class="item-head">
                <span class="status-pill"
                      [class.s-completed]="item.status === 'COMPLETED'"
                      [class.s-failed]="item.status === 'FAILED'"
                      [class.s-running]="item.status === 'RUNNING'"
                      [class.s-pending]="item.status === 'PENDING'">
                  <span class="dot"></span>{{ statusLabel(item.status) }}
                </span>
                <span class="when">{{ item.createdAt | date:'dd MMM y, HH:mm' }}</span>
              </div>
              <div class="item-body">
                <div class="counts">
                  <span class="count count-positive">
                    <span [innerHTML]="checkSvg()"></span>
                    {{ item.positiveCount }} fortalezas
                  </span>
                  <span class="count count-improvement">
                    <span [innerHTML]="alertSvg()"></span>
                    {{ item.improvementCount }} por mejorar
                  </span>
                </div>
                @if (item.errorMessage) {
                  <div class="error">{{ item.errorMessage }}</div>
                }
              </div>
              @if (item.status === 'COMPLETED') {
                <div class="item-arrow" [innerHTML]="arrowSvg()"></div>
              }
            </button>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }

    .historial {
      background: #fff;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .historial-head {
      display: flex; justify-content: space-between; align-items: flex-end;
      gap: 1rem; flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }
    .section-title { font-size: 18px; font-weight: 700; color: #1f2937; margin: 0; }
    .section-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0; max-width: 540px; }

    .btn-refresh {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.45rem 0.875rem;
      border-radius: 0.5rem;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #1f2937;
      font-size: 13px; font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s ease;
    }
    .btn-refresh ::ng-deep svg { width: 14px; height: 14px; }
    .btn-refresh:not([disabled]):hover { background: #f1f5f9; }
    .btn-refresh[disabled] { opacity: 0.6; cursor: not-allowed; }

    .empty {
      padding: 1.5rem 1rem;
      text-align: center;
      color: #6b7280;
      font-size: 13.5px;
      border: 1.5px dashed #cbd5e1;
      border-radius: 0.75rem;
      background: #f8fafc;
    }
    .empty.muted { color: #94a3b8; font-style: italic; }
    .empty-icon { display: block; margin-bottom: 0.5rem; }
    .empty-icon ::ng-deep svg { width: 28px; height: 28px; color: #94a3b8; }

    .items { display: flex; flex-direction: column; gap: 0.625rem; }
    .item {
      display: flex; flex-direction: column; gap: 0.5rem;
      padding: 0.875rem 1rem;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: all 0.2s ease;
      position: relative;
    }
    .item:hover { background: #fff; border-color: #006600; box-shadow: 0 4px 12px rgba(0,92,0,0.08); transform: translateY(-1px); }
    .item:focus-visible { outline: 2px solid #006600; outline-offset: 2px; }
    .item.in-progress { cursor: progress; }

    .item-head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .when { font-size: 12px; color: #6b7280; font-weight: 600; }

    .status-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    .status-pill .dot { width: 6px; height: 6px; border-radius: 50%; }
    .s-completed { background: #e8f5e9; color: #006600; }
    .s-completed .dot { background: #006600; }
    .s-running { background: #eef5fa; color: #1d4ed8; }
    .s-running .dot { background: #1d4ed8; animation: pulse 1.2s ease-in-out infinite; }
    .s-pending { background: #fef3c7; color: #92400e; }
    .s-pending .dot { background: #f59e0b; }
    .s-failed { background: #fee2e2; color: #b91c1c; }
    .s-failed .dot { background: #b91c1c; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    .item-body { display: flex; flex-direction: column; gap: 0.375rem; }
    .counts { display: flex; gap: 0.875rem; flex-wrap: wrap; }
    .count {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 12.5px; font-weight: 600; color: #374151;
    }
    .count ::ng-deep svg { width: 13px; height: 13px; }
    .count-positive ::ng-deep svg { color: #006600; }
    .count-improvement ::ng-deep svg { color: #f59e0b; }

    .error {
      font-size: 12px;
      color: #b91c1c;
      background: #fef2f2;
      padding: 0.35rem 0.5rem;
      border-radius: 0.4rem;
      border-left: 3px solid #b91c1c;
    }

    .item-arrow {
      position: absolute;
      right: 0.875rem; top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      transition: color 0.2s ease, transform 0.2s ease;
    }
    .item-arrow ::ng-deep svg { width: 18px; height: 18px; }
    .item:hover .item-arrow { color: #006600; transform: translateY(-50%) translateX(2px); }
  `]
})
export class RevisionHistorialComponent {
  private sanitizer = inject(DomSanitizer);

  @Input() items: RevisionGeneralJobDTO[] = [];
  @Input() loading = false;

  @Output() select = new EventEmitter<RevisionGeneralJobDTO>();
  @Output() refresh = new EventEmitter<void>();

  statusLabel(s: RevisionGeneralStatus): string {
    switch (s) {
      case 'PENDING': return 'En cola';
      case 'RUNNING': return 'Procesando';
      case 'COMPLETED': return 'Completada';
      case 'FAILED': return 'Falló';
    }
  }

  refreshSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`
    );
  }
  historySvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13a9 9 0 1 0 .49-5.236L3 8"/><path d="M12 7v5l4 2"/></svg>`
    );
  }
  checkSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    );
  }
  alertSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    );
  }
  arrowSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`
    );
  }
}
