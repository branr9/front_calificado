import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CondicionDocumentVM } from '../../core/models/condicion.model';

@Component({
  selector: 'app-condition-index-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <aside class="index-card">
      <header class="index-head">
        <div class="index-eyebrow">ÍNDICE DEL DOCUMENTO</div>
        <h3 class="index-title">9 Condiciones</h3>
      </header>

      @if (items.length === 0) {
        <div class="index-empty">
          Aún no hay condiciones cargadas.
        </div>
      } @else {
        <ul class="index-list">
          @for (item of items; track item.numero) {
            <li class="index-item"
                [class.active]="item.numero === activeNumero"
                [attr.data-status]="item.status"
                (click)="select.emit(item)"
                tabindex="0"
                role="button"
                (keydown.enter)="select.emit(item)"
                (keydown.space)="select.emit(item); $event.preventDefault()">
              <span class="active-bar"></span>
              <span class="item-dot" [style.background]="item.color"></span>
              <span class="item-num">{{ pad(item.numero) }}</span>
              <span class="item-name" [title]="item.nombre">{{ item.nombre }}</span>
              <span class="item-pct">{{ item.pct }}%</span>
            </li>
          }
        </ul>
      }

      <footer class="index-foot">
        <div class="foot-row">
          <span class="foot-label">Palabras</span>
          <span class="foot-value">{{ totalPalabras | number }}</span>
        </div>
        <div class="foot-row">
          <span class="foot-label">Anexos</span>
          <span class="foot-value">{{ totalAnexos | number }}</span>
        </div>
        <div class="foot-row">
          <span class="foot-label">Completas</span>
          <span class="foot-value">{{ completas }}/{{ items.length || 9 }}</span>
        </div>
        <div class="foot-progress">
          <div class="foot-progress-head">
            <span>Progreso global</span>
            <span>{{ progresoGlobal }}%</span>
          </div>
          <div class="foot-progress-bar">
            <div class="foot-progress-fill" [style.width.%]="progresoGlobal"></div>
          </div>
        </div>
      </footer>
    </aside>
  `,
  styles: [`
    :host { display: block; }

    .index-card {
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(15, 23, 42, 0.04);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 1.5rem;
      max-height: calc(100vh - 3rem);
    }

    .index-head {
      padding: 1.1rem 1.25rem 0.85rem;
      border-bottom: 1px solid #eef2f7;
    }
    .index-eyebrow {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 1.3px;
      text-transform: uppercase;
      color: #006600;
      margin-bottom: 0.25rem;
    }
    .index-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .index-empty {
      padding: 1.5rem;
      color: #94a3b8;
      font-size: 13px;
      text-align: center;
    }

    .index-list {
      list-style: none;
      margin: 0;
      padding: 0.4rem 0.5rem;
      overflow-y: auto;
      flex: 1;
    }
    .index-item {
      position: relative;
      display: grid;
      grid-template-columns: auto auto 1fr auto;
      align-items: center;
      column-gap: 0.55rem;
      padding: 0.55rem 0.7rem;
      padding-left: 0.95rem;
      border-radius: 0.55rem;
      cursor: pointer;
      transition: background 0.15s ease;
      outline: none;
    }
    .index-item:hover { background: #f7f9fc; }
    .index-item:focus-visible { box-shadow: inset 0 0 0 2px #006600; }
    .index-item.active { background: #f0f8f0; }

    .active-bar {
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: transparent;
      transition: background 0.15s ease;
    }
    .index-item.active .active-bar { background: #006600; }

    .item-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #cbd5e1;
    }
    .item-num {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.4px;
      min-width: 18px;
    }
    .index-item.active .item-num { color: #006600; }
    .item-name {
      font-size: 12.5px;
      color: #1f2937;
      font-weight: 500;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .index-item.active .item-name { font-weight: 700; color: #0f172a; }
    .item-pct {
      font-size: 11.5px;
      font-weight: 700;
      color: #64748b;
      flex-shrink: 0;
    }
    .index-item[data-status="complete"] .item-pct { color: #006600; }
    .index-item[data-status="progress"] .item-pct { color: #b45309; }

    .index-foot {
      border-top: 1px solid #eef2f7;
      padding: 1rem 1.25rem 1.2rem;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .foot-row {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
    }
    .foot-label { color: #64748b; }
    .foot-value { color: #0f172a; font-weight: 600; }

    .foot-progress { margin-top: 0.4rem; }
    .foot-progress-head {
      display: flex; justify-content: space-between;
      font-size: 11.5px; color: #006600; font-weight: 700;
      letter-spacing: 0.3px;
      margin-bottom: 0.35rem;
    }
    .foot-progress-bar {
      height: 5px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }
    .foot-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #007b00 0%, #006600 100%);
      border-radius: 999px;
      transition: width 0.4s ease;
    }
  `]
})
export class ConditionIndexSidebarComponent {
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) items: CondicionDocumentVM[] = [];
  @Input() activeNumero: number | null = null;
  @Input() totalPalabras = 0;
  @Input() totalAnexos = 0;
  @Input() progresoGlobal = 0;

  @Output() select = new EventEmitter<CondicionDocumentVM>();

  get completas(): number {
    return this.items.filter(i => i.status === 'complete').length;
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
