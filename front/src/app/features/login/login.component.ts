import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>Sistema de Acreditación Académica</h1>
        <p class="subtitle">Gestión de Programas Académicos</p>

        <form [formGroup]="form" (ngSubmit)="onLogin()" class="login-form">
          <label class="field-label" for="username">Usuario o correo</label>
          <input id="username" type="text" class="field" formControlName="username" autocomplete="username" />

          <label class="field-label" for="password">Contraseña</label>
          <input id="password" type="password" class="field" formControlName="password" autocomplete="current-password" />

          @if (errorMessage()) {
            <p class="error-message">{{ errorMessage() }}</p>
          }

          <button
            class="btn-login"
            [disabled]="form.invalid || loading()"
            type="submit">
            {{ loading() ? 'Ingresando...' : 'Iniciar Sesion' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 400px;
      width: 90%;
    }

    h1 {
      color: #333;
      margin-bottom: 0.5rem;
      font-size: 1.8rem;
    }

    .subtitle {
      color: #666;
      margin-bottom: 2rem;
      font-size: 0.95rem;
    }

    .login-form {
      text-align: left;
    }

    .field-label {
      display: block;
      margin-bottom: 0.4rem;
      font-size: 0.9rem;
      color: #334155;
      font-weight: 600;
    }

    .field {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.75rem 0.85rem;
      font-size: 0.95rem;
      margin-bottom: 1rem;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
    }

    .field:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
    }

    .error-message {
      color: #b91c1c;
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 0.65rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.88rem;
      margin: 0 0 1rem;
    }

    .btn-login {
      width: 100%;
      padding: 1rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .btn-login:hover {
      background: #5568d3;
    }

    .btn-login:disabled {
      background: #a5b4fc;
      cursor: not-allowed;
    }

    .btn-login:active {
      transform: scale(0.98);
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  onLogin(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(this.getLoginError(err));
      }
    });
  }

  private getLoginError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401) {
        return 'Credenciales invalidas.';
      }

      if (err.status === 0) {
        return 'No hay conexion con el servidor de autenticacion.';
      }

      return 'No fue posible iniciar sesion.';
    }

    if (err instanceof Error && err.message) {
      return err.message;
    }

    return 'Ocurrio un error al iniciar sesion.';
  }
}
