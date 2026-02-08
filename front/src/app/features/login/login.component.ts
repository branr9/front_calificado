import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>Sistema de Acreditación Académica</h1>
        <p class="subtitle">Gestión de Programas Académicos</p>
        
        <button 
          class="btn-login" 
          (click)="onLogin()"
          type="button">
          Iniciar Sesión
        </button>
        
        <p class="credentials">
          Usuario: <strong>user</strong><br>
          Contraseña: <strong>admin123</strong>
        </p>
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

    .btn-login:active {
      transform: scale(0.98);
    }

    .credentials {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .credentials strong {
      color: #333;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);

  onLogin(): void {
    this.authService.login();
  }
}
