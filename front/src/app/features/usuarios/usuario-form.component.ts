import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioDTO, CreateUsuarioDTO, UpdateUsuarioDTO } from '../../core/models/usuario.model';

@Component({
  selector: 'app-usuario-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="container">
      <div class="form-card">
        <header class="form-header">
          <h1>{{ isEditMode() ? 'Editar Usuario' : 'Nuevo Usuario' }}</h1>
          <button class="btn-back" (click)="onCancel()" type="button">← Volver</button>
        </header>

        @if (loading()) {
          <div class="loading">Cargando...</div>
        } @else if (error()) {
          <div class="error">{{ error() }}</div>
        } @else {
          <form [formGroup]="usuarioForm" (ngSubmit)="onSubmit()">
            <!-- Información del Usuario -->
            <div class="section-title">👤 Información del Usuario</div>
            
            <div class="form-group">
              <label for="username">
                Nombre de Usuario <span class="required">*</span>
              </label>
              <input
                id="username"
                type="text"
                formControlName="username"
                placeholder="Ej: jdoe"
                [class.invalid]="isFieldInvalid('username')"
              />
              @if (isFieldInvalid('username')) {
                <span class="error-message">El nombre de usuario es obligatorio</span>
              }
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email">
                  Email <span class="required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="Ej: usuario@ejemplo.com"
                  [class.invalid]="isFieldInvalid('email')"
                />
                @if (isFieldInvalid('email')) {
                  <span class="error-message">El email es válido y obligatorio</span>
                }
              </div>

              <div class="form-group">
                <label for="nombreCompleto">
                  Nombre Completo <span class="required">*</span>
                </label>
                <input
                  id="nombreCompleto"
                  type="text"
                  formControlName="nombreCompleto"
                  placeholder="Ej: Juan Pérez"
                  [class.invalid]="isFieldInvalid('nombreCompleto')"
                />
                @if (isFieldInvalid('nombreCompleto')) {
                  <span class="error-message">El nombre completo es obligatorio</span>
                }
              </div>
            </div>

            <!-- Contraseña (solo en creación) -->
            @if (!isEditMode()) {
              <div class="form-group">
                <label for="password">
                  Contraseña <span class="required">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  placeholder="Ingresa una contraseña segura"
                  [class.invalid]="isFieldInvalid('password')"
                />
                @if (isFieldInvalid('password')) {
                  <span class="error-message">La contraseña es obligatoria (mínimo 8 caracteres)</span>
                }
                <span class="help-text">Mínimo 8 caracteres, incluir mayúsculas, minúsculas y números</span>
              </div>
            }

            <!-- Rol y Estado -->
            <div class="section-title">🔐 Permisos y Estado</div>

            <div class="form-row">
              <div class="form-group">
                <label for="rol">
                  Rol <span class="required">*</span>
                </label>
                <select
                  id="rol"
                  formControlName="rol"
                  [class.invalid]="isFieldInvalid('rol')"
                >
                  <option value="">Selecciona un rol</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                  <option value="FUNCIONARIO">Funcionario</option>
                  <option value="DOCENTE">Docente</option>
                  <option value="USUARIO">Usuario</option>
                </select>
                @if (isFieldInvalid('rol')) {
                  <span class="error-message">El rol es obligatorio</span>
                }
              </div>

              <div class="form-group">
                <label for="activo">
                  Estado
                </label>
                <div class="checkbox-group">
                  <input
                    id="activo"
                    type="checkbox"
                    formControlName="activo"
                  />
                  <label for="activo" class="checkbox-label">Activo</label>
                </div>
              </div>
            </div>

            <!-- Botones -->
            <div class="form-actions">
              <button 
                type="button" 
                class="btn btn-secondary" 
                (click)="onCancel()"
                [disabled]="saving()">
                Cancelar
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                [disabled]="!usuarioForm.valid || saving()">
                {{ saving() ? 'Guardando...' : (isEditMode() ? 'Actualizar' : 'Crear Usuario') }}
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
    }

    .form-card {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .form-header h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #333;
    }

    .btn-back {
      background: white;
      border: 1px solid #ddd;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-back:hover {
      background: #f0f0f0;
    }

    form {
      padding: 2rem;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      margin: 1.5rem 0 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #5b4cdb;
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
      font-weight: 600;
      color: #333;
      font-size: 0.95rem;
    }

    .required {
      color: #d32f2f;
    }

    input[type="text"],
    input[type="email"],
    input[type="password"],
    select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 0.375rem;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    input[type="text"]:focus,
    input[type="email"]:focus,
    input[type="password"]:focus,
    select:focus {
      outline: none;
      border-color: #5b4cdb;
      box-shadow: 0 0 0 3px rgba(91, 76, 219, 0.1);
    }

    input[type="text"]:disabled,
    input[type="email"]:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }

    input.invalid,
    select.invalid {
      border-color: #d32f2f;
    }

    .error-message {
      display: block;
      color: #d32f2f;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }

    .help-text {
      display: block;
      color: #999;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .checkbox-label {
      margin: 0;
      font-weight: 400;
      cursor: pointer;
    }

    .loading {
      padding: 2rem;
      text-align: center;
      color: #666;
    }

    .error {
      background: #fee;
      border: 1px solid #fcc;
      color: #c33;
      padding: 1rem;
      border-radius: 0.75rem;
      margin: 1rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .btn {
      flex: 1;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #5b4cdb;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #4a3bb8;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(91, 76, 219, 0.3);
    }

    .btn-primary:disabled {
      background: #ddd;
      cursor: not-allowed;
      color: #999;
    }

    .btn-secondary {
      background: white;
      color: #333;
      border: 1px solid #ddd;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #f5f5f5;
    }

    .btn-secondary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 600px) {
      .container {
        padding: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      form {
        padding: 1rem;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class UsuarioFormComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  protected usuarioForm!: FormGroup;
  protected loading = signal(false);
  protected saving = signal(false);
  protected error = signal<string | null>(null);
  protected isEditMode = signal(false);
  
  private usuarioId: number | null = null;

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.usuarioForm = this.fb.group({
      username: [{value: '', disabled: false}, [Validators.required]],
      email: [{value: '', disabled: false}, [Validators.required, Validators.email]],
      password: [{value: '', disabled: false}, [Validators.minLength(8)]],
      nombreCompleto: [{value: '', disabled: false}, Validators.required],
      rol: [{value: '', disabled: false}, Validators.required],
      activo: [true]
    });
  }

  private checkEditMode(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.usuarioId = +params['id'];
        this.isEditMode.set(true);
        this.loadUsuario();
        
        // En modo edición, la contraseña no es requerida
        this.usuarioForm.get('password')?.setValidators([]);
        this.usuarioForm.get('password')?.updateValueAndValidity();
        
        // Username no es editable - usar disable() apropiadamente
        const usernameControl = this.usuarioForm.get('username');
        if (usernameControl) {
          usernameControl.disable({emitEvent: false});
        }
      } else {
        // En creación, la contraseña es requerida
        this.usuarioForm.get('password')?.setValidators([
          Validators.required,
          Validators.minLength(8)
        ]);
        this.usuarioForm.get('password')?.updateValueAndValidity();
      }
    });
  }

  private loadUsuario(): void {
    if (!this.usuarioId) return;

    this.loading.set(true);
    this.usuarioService.getUsuario(this.usuarioId).subscribe({
      next: (usuario) => {
        this.usuarioForm.patchValue({
          username: usuario.username,
          email: usuario.email,
          nombreCompleto: usuario.nombreCompleto,
          rol: usuario.rol,
          activo: usuario.activo ?? true
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el usuario');
        this.loading.set(false);
        console.error('Error loading usuario:', err);
      }
    });
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.usuarioForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  protected onSubmit(): void {
    if (!this.usuarioForm.valid) return;

    this.saving.set(true);
    this.error.set(null);

    const formData = this.usuarioForm.getRawValue(); // getRawValue incluye campos disabled

    if (this.isEditMode() && this.usuarioId) {
      // En edición no enviamos username ni password
      const updateData: UpdateUsuarioDTO = {
        email: formData.email,
        nombreCompleto: formData.nombreCompleto,
        rol: formData.rol,
        activo: formData.activo
      };

      console.log('📤 UPDATE data enviado:', JSON.stringify(updateData, null, 2));

      this.usuarioService.updateUsuario(this.usuarioId, updateData).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/usuarios']);
        },
        error: (err) => {
          this.error.set('Error al actualizar el usuario');
          this.saving.set(false);
          console.error('Error updating usuario:', err);
        }
      });
    } else {
      // En creación
      const createData: CreateUsuarioDTO = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        nombreCompleto: formData.nombreCompleto,
        rol: formData.rol
      };

      console.log('📤 CREATE data enviado:', JSON.stringify(createData, null, 2));

      this.usuarioService.createUsuario(createData).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/usuarios']);
        },
        error: (err) => {
          this.error.set('Error al crear el usuario');
          this.saving.set(false);
          console.error('❌ Error creando usuario:', err);
          console.error('Full error object:', err);
        }
      });
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/usuarios']);
  }
}
