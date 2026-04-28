import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProgramaService } from '../../core/services/programa.service';
import { ProgramaDTO } from '../../core/models/programa.model';
import { EvidenciaService } from '../../core/services/evidencia.service';
import { LineamientoService } from '../../core/services/lineamiento.service';
import { forkJoin, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-programa-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="container">
      <div class="form-card">
        <header class="form-header">
          <h1>{{ isEditMode() ? 'Editar Programa' : 'Nuevo Programa' }}</h1>
          <button class="btn-back" (click)="onCancel()" type="button">← Volver</button>
        </header>

        @if (loading()) {
          <div class="loading">Cargando...</div>
        } @else if (error()) {
          <div class="error">{{ error() }}</div>
        } @else {
          <form [formGroup]="programaForm" (ngSubmit)="onSubmit()">
            <!-- Información Básica -->
            <div class="section-title"> Información Básica</div>

            <div class="form-group">
              <label for="nombre">
                Nombre del Programa <span class="required">*</span>
              </label>
              <input
                id="nombre"
                type="text"
                formControlName="nombre"
                placeholder="Ej: Ingeniería de Sistemas"
                [class.invalid]="isFieldInvalid('nombre')"
              />
              @if (isFieldInvalid('nombre')) {
                <span class="error-message">El nombre es obligatorio</span>
              }
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="nivel">
                  Nivel <span class="required">*</span>
                </label>
                <select
                  id="nivel"
                  formControlName="nivel"
                  [class.invalid]="isFieldInvalid('nivel')"
                >
                  <option value="">Selecciona un nivel</option>
                  <option value="Pregrado">Pregrado</option>
                  <option value="Especialización">Especialización</option>
                  <option value="Maestría">Maestría</option>
                  <option value="Doctorado">Doctorado</option>
                </select>
                @if (isFieldInvalid('nivel')) {
                  <span class="error-message">El nivel es obligatorio</span>
                }
              </div>

              <div class="form-group">
                <label for="modalidad">
                  Modalidad <span class="required">*</span>
                </label>
                <select
                  id="modalidad"
                  formControlName="modalidad"
                  [class.invalid]="isFieldInvalid('modalidad')"
                >
                  <option value="">Selecciona una modalidad</option>
                  <option value="Presencial">Presencial</option>
                  <option value="Virtual">Virtual</option>
                  <option value="Híbrida">Híbrida</option>
                  <option value="A Distancia">A Distancia</option>
                </select>
                @if (isFieldInvalid('modalidad')) {
                  <span class="error-message">La modalidad es obligatoria</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label for="codigoSnies">
                Código SNIES
              </label>
              <input
                id="codigoSnies"
                type="text"
                formControlName="codigoSnies"
                placeholder="Ej: 123456"
              />
              <span class="help-text">Opcional</span>
            </div>

            <!-- Documentos para IA -->
           

            <div class="form-actions">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="onCancel()">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="!programaForm.valid || saving()">
                {{ saving() ? 'Guardando...' : (isEditMode() ? 'Actualizar' : 'Crear Programa') }}
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
    }

    .form-card {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    h1 {
      color: #333;
      margin: 0;
      font-size: 1.8rem;
    }

    .btn-back {
      padding: 0.5rem 1rem;
      background: #e0e0e0;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.95rem;
      transition: background 0.3s ease;
    }

    .btn-back:hover {
      background: #d0d0d0;
    }

    .section-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #333;
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #006600;
    }

    .help-banner {
      background: #e3f2fd;
      color: #1565c0;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #555;
      font-weight: 600;
    }

    .required {
      color: #d32f2f;
    }

    input, select {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    input:focus, select:focus {
      outline: none;
      border-color: #006600;
    }

    input.invalid, select.invalid {
      border-color: #d32f2f;
    }

    .error-message {
      display: block;
      margin-top: 0.25rem;
      color: #d32f2f;
      font-size: 0.85rem;
    }

    .help-text {
      display: block;
      margin-top: 0.25rem;
      color: #999;
      font-size: 0.85rem;
    }

    .upload-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .upload-card {
      border: 2px dashed #ddd;
      border-radius: 0.5rem;
      padding: 1.5rem;
      background: #fafafa;
      transition: all 0.3s ease;
    }

    .upload-card:hover {
      border-color: #006600;
      background: #f0f8f0;
    }

    .upload-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .upload-icon {
      font-size: 2rem;
    }

    .upload-title {
      font-weight: 700;
      color: #333;
      margin-bottom: 0.25rem;
    }

    .upload-desc {
      font-size: 0.85rem;
      color: #666;
    }

    .file-input {
      display: none;
    }

    .btn-upload {
      width: 100%;
      padding: 0.75rem;
      background: #006600;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .btn-upload:hover {
      background: #005c00;
    }

    .file-list {
      margin-top: 1rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background: white;
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
    }

    .file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .btn-remove {
      padding: 0.25rem 0.5rem;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: bold;
      transition: background 0.3s ease;
    }

    .btn-remove:hover {
      background: #d32f2f;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
    }

    .btn {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #006600;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #005c00;
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #e0e0e0;
      color: #333;
    }

    .btn-secondary:hover {
      background: #d0d0d0;
    }

    .loading, .error {
      text-align: center;
      padding: 2rem;
      font-size: 1.1rem;
    }

    .error {
      color: #d32f2f;
      background: #ffebee;
      border-radius: 0.5rem;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class ProgramaFormComponent implements OnInit {
  private programaService = inject(ProgramaService);
  private evidenciaService = inject(EvidenciaService);
  private lineamientoService = inject(LineamientoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  protected isEditMode = signal(false);
  protected loading = signal(false);
  protected saving = signal(false);
  protected error = signal<string | null>(null);
  private programaId: number | null = null;

  protected programaForm: FormGroup;

  // Archivos seleccionados
  protected archivosLineamientos = signal<File[]>([]);
  protected archivosSecciones = signal<File[]>([]);
  protected archivosEvidencias = signal<File[]>([]);
  protected archivosDocumentos = signal<File[]>([]);

  constructor() {
    this.programaForm = this.fb.group({
      nombre: ['', Validators.required],
      nivel: ['', Validators.required],
      modalidad: ['', Validators.required],
      codigoSnies: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.programaId = +id;
      this.loadPrograma(this.programaId);
    }
  }

  loadPrograma(id: number): void {
    this.loading.set(true);
    this.programaService.getPrograma(id).subscribe({
      next: (programa) => {
        this.programaForm.patchValue({
          nombre: programa.nombre,
          nivel: programa.nivel,
          modalidad: programa.modalidad,
          codigoSnies: programa.codigoSnies
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el programa');
        this.loading.set(false);
        console.error('Error loading programa:', err);
      }
    });
  }

  onFileSelect(event: Event, tipo: 'lineamientos' | 'secciones' | 'evidencias' | 'documentos'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const nuevosArchivos = Array.from(input.files);

    switch(tipo) {
      case 'lineamientos':
        this.archivosLineamientos.update(files => [...files, ...nuevosArchivos]);
        break;
      case 'secciones':
        this.archivosSecciones.update(files => [...files, ...nuevosArchivos]);
        break;
      case 'evidencias':
        this.archivosEvidencias.update(files => [...files, ...nuevosArchivos]);
        break;
      case 'documentos':
        this.archivosDocumentos.update(files => [...files, ...nuevosArchivos]);
        break;
    }

    // Reset input
    input.value = '';
  }

  removeFile(tipo: 'lineamientos' | 'secciones' | 'evidencias' | 'documentos', fileName: string): void {
    switch(tipo) {
      case 'lineamientos':
        this.archivosLineamientos.update(files => files.filter(f => f.name !== fileName));
        break;
      case 'secciones':
        this.archivosSecciones.update(files => files.filter(f => f.name !== fileName));
        break;
      case 'evidencias':
        this.archivosEvidencias.update(files => files.filter(f => f.name !== fileName));
        break;
      case 'documentos':
        this.archivosDocumentos.update(files => files.filter(f => f.name !== fileName));
        break;
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.programaForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.programaForm.valid) {
      this.saving.set(true);
      const programaData = this.programaForm.value;

      const request = this.isEditMode() && this.programaId
        ? this.programaService.updatePrograma(this.programaId, programaData)
        : this.programaService.createPrograma(programaData);

      request.subscribe({
        next: (programa) => {
          // Si es modo creación y hay archivos, subirlos
          if (!this.isEditMode() && this.hayArchivos()) {
            this.uploadDocumentos(programa.id);
          } else {
            this.router.navigate(['/programas']);
          }
        },
        error: (err) => {
          console.error('Error completo:', err);
          let errorMsg = 'Error al guardar el programa';

          if (err.status === 0) {
            errorMsg = 'No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:8080';
          } else if (err.status === 401 || err.status === 403) {
            errorMsg = 'Error de autenticación. Verifica las credenciales.';
          } else if (err.error?.message) {
            errorMsg = `Error: ${err.error.message}`;
          } else if (err.message) {
            errorMsg = `Error: ${err.message}`;
          }

          alert(errorMsg);
          this.saving.set(false);
        }
      });
    } else {
      Object.keys(this.programaForm.controls).forEach(key => {
        this.programaForm.get(key)?.markAsTouched();
      });
    }
  }

  private hayArchivos(): boolean {
    return this.archivosLineamientos().length > 0 ||
           this.archivosSecciones().length > 0 ||
           this.archivosEvidencias().length > 0 ||
           this.archivosDocumentos().length > 0;
  }

  private uploadDocumentos(programaId: number): void {
    // Fetch the 9 lineamientos auto-created with the programa, then distribute files:
    // archivosLineamientos → lineamiento 1, archivosSecciones → lineamiento 2,
    // archivosEvidencias  → lineamiento 3, archivosDocumentos  → lineamiento 4+
    this.lineamientoService.getLineamientos(programaId).pipe(
      switchMap(lineamientos => {
        if (!lineamientos.length) return of([]);

        const uploads: any[] = [];

        const byIndex = (i: number) => lineamientos[Math.min(i, lineamientos.length - 1)].id;

        this.archivosLineamientos().forEach(file =>
          uploads.push(this.evidenciaService.uploadEvidencia(byIndex(0), file))
        );
        this.archivosSecciones().forEach(file =>
          uploads.push(this.evidenciaService.uploadEvidencia(byIndex(1), file))
        );
        this.archivosEvidencias().forEach(file =>
          uploads.push(this.evidenciaService.uploadEvidencia(byIndex(2), file))
        );
        this.archivosDocumentos().forEach(file =>
          uploads.push(this.evidenciaService.uploadEvidencia(byIndex(3), file))
        );

        return uploads.length ? forkJoin(uploads) : of([]);
      })
    ).subscribe({
      next: () => this.router.navigate(['/programas']),
      error: (err) => {
        console.error('Error uploading files:', err);
        alert('Programa creado, pero hubo errores al subir algunos documentos');
        this.router.navigate(['/programas']);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/programas']);
  }
}
