import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild, ElementRef, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AnexoVM } from '../../core/models/condicion.model';

@Component({
  selector: 'app-attachment-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="attach-panel">
      <header class="attach-head">
        <span class="attach-title">ANEXOS · {{ items.length }}</span>
      </header>

      @if (items.length === 0) {
        <div class="attach-empty">
          Aún no hay anexos para esta condición.
        </div>
      } @else {
        <ul class="attach-list">
          @for (a of items; track a.id) {
            <li class="attach-item">
              <span class="attach-ext" [attr.data-type]="a.type">{{ a.type.toUpperCase() }}</span>
              <div class="attach-info">
                <div class="attach-name" [title]="a.name">{{ a.name }}</div>
                <div class="attach-meta">{{ a.size }} · {{ a.updated }}</div>
              </div>
              <button class="attach-action"
                      type="button"
                      [attr.aria-label]="'Descargar ' + a.name"
                      (click)="download.emit(a)">
                <span [innerHTML]="downloadSvg()"></span>
              </button>
            </li>
          }
        </ul>
      }

      <button class="attach-upload" type="button" (click)="onUploadClick()">
        <span [innerHTML]="plusSvg()"></span>
        <span>Subir anexo</span>
      </button>

      <input #fileInput type="file" class="hidden-file" (change)="onFileSelected($event)" />
    </aside>
  `,
  styles: [`
    :host { display: block; }

    .attach-panel {
      background: #f7f9fc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .attach-head {
      display: flex; align-items: center; justify-content: space-between;
    }
    .attach-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.7px;
      text-transform: uppercase;
      color: #64748b;
    }

    .attach-empty {
      font-size: 12.5px;
      color: #94a3b8;
      padding: 1rem 0.5rem;
      text-align: center;
      border: 1px dashed #cbd5e1;
      border-radius: 0.5rem;
      background: #fff;
    }

    .attach-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .attach-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 0.55rem;
      padding: 0.55rem 0.65rem;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .attach-item:hover {
      border-color: #006600;
      transform: translateX(2px);
    }
    .attach-ext {
      flex-shrink: 0;
      width: 40px;
      height: 32px;
      border-radius: 0.4rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.4px;
      color: #fff;
      background: #006600;
    }
    .attach-ext[data-type="pdf"]  { background: #dc2626; }
    .attach-ext[data-type="docx"] { background: #2563eb; }
    .attach-ext[data-type="xlsx"] { background: #059669; }
    .attach-ext[data-type="zip"]  { background: #7c3aed; }
    .attach-ext[data-type="img"]  { background: #ea580c; }
    .attach-info {
      flex: 1;
      min-width: 0;
    }
    .attach-name {
      font-size: 12.5px;
      font-weight: 600;
      color: #1f2937;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .attach-meta {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 1px;
    }
    .attach-action {
      flex-shrink: 0;
      width: 28px; height: 28px;
      border: none;
      background: transparent;
      border-radius: 0.4rem;
      color: #64748b;
      cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .attach-action:hover { background: #f0f8f0; color: #006600; }
    .attach-action ::ng-deep svg { width: 15px; height: 15px; }

    .attach-upload {
      margin-top: 0.25rem;
      border: 1.5px dashed #006600;
      background: #f0f8f0;
      color: #006600;
      border-radius: 0.55rem;
      padding: 0.6rem;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      gap: 0.4rem;
      transition: background 0.15s ease, transform 0.15s ease;
      font-family: inherit;
    }
    .attach-upload:hover { background: #e6f1e6; transform: translateY(-1px); }
    .attach-upload ::ng-deep svg { width: 13px; height: 13px; }

    .hidden-file { display: none; }
  `]
})
export class AttachmentPanelComponent {
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) items: AnexoVM[] = [];
  @Input({ required: true }) conditionNumber!: number;

  @Output() download = new EventEmitter<AnexoVM>();
  @Output() upload = new EventEmitter<{ conditionNumber: number; file: File }>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  onUploadClick(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.upload.emit({ conditionNumber: this.conditionNumber, file });
    input.value = '';
  }

  downloadSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`
    );
  }

  plusSvg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
    );
  }
}
