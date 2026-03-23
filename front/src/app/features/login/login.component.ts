import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  constructor() {
    // Constructor sin efectos colaterales
  }

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
        // AuthService ya navega al dashboard cuando el login es exitoso
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
        return 'Credenciales inválidas.';
      }

      if (err.status === 0) {
        return 'No hay conexión con el servidor de autenticación.';
      }

      return 'No fue posible iniciar sesión.';
    }

    if (err instanceof Error && err.message) {
      return err.message;
    }

    return 'Ocurrió un error al iniciar sesión.';
  }
}
