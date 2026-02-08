import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LINEAMIENTOS_DECRETO_1330 } from '../../core/models/lineamiento.model';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

interface LineamientoItem {
  numero: number;
  nombre: string;
  icono: string;
  route: string;
  indicator?: boolean;
}

@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">📋</span>
            <div class="logo-content">
              <div class="logo-title">Registro Calificado</div>
              <div class="logo-subtitle">Decreto 1330 de 2019</div>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <!-- Sección Principal -->
          <div class="nav-section">
            <div class="section-title">PRINCIPAL</div>
            @for (item of menuPrincipal; track item.route) {
              <a 
                [routerLink]="item.route"
                routerLinkActive="active"
                class="nav-item"
                [attr.aria-label]="item.label">
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            }
          </div>

          <!-- Sección Lineamientos -->
          <div class="nav-section">
            <div class="section-title">LINEAMIENTOS</div>
            @for (item of lineamientos; track item.numero) {
              <a 
                [routerLink]="item.route"
                routerLinkActive="active"
                class="nav-item lineamiento"
                [attr.aria-label]="item.nombre">
                <span class="nav-icon">{{ item.icono }}</span>
                <span class="nav-label">{{ item.nombre }}</span>
                @if (item.indicator) {
                  <span class="indicator"></span>
                }
              </a>
            }
          </div>

          <!-- Progreso General -->
          <div class="progress-section">
            <div class="progress-header">
              <span>Progreso General</span>
            </div>
            <div class="progress-content">
              <div class="progress-text">0% completado</div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="0"></div>
              </div>
            </div>
          </div>
        </nav>

        <div class="sidebar-footer">
          <button 
            class="logout-btn" 
            (click)="onLogout()"
            type="button">
            <span class="nav-icon">🚪</span>
            <span class="nav-label">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      background: #f0f2f7;
    }

    .sidebar {
      width: 280px;
      background: linear-gradient(180deg, #5b4cdb 0%, #7c5ce0 50%, #9370db 100%);
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
      z-index: 1000;
      box-shadow: 4px 0 20px rgba(91, 76, 219, 0.15);
    }

    .sidebar-header {
      padding: 1.75rem 1.5rem;
      background: rgba(0, 0, 0, 0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-icon {
      font-size: 2.5rem;
    }

    .logo-content {
      flex: 1;
    }

    .logo-title {
      font-size: 1.1rem;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 0.25rem;
    }

    .logo-subtitle {
      font-size: 0.75rem;
      opacity: 0.9;
      font-weight: 400;
    }

    .sidebar-nav {
      flex: 1;
      padding: 0.5rem 0;
      overflow-y: auto;
    }

    .nav-section {
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 1rem 1.5rem 0.5rem;
      opacity: 0.7;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      color: rgba(255, 255, 255, 0.85);
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
      font-size: 0.95rem;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .nav-item.active {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      font-weight: 600;
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: white;
      border-radius: 0 4px 4px 0;
    }

    .nav-icon {
      font-size: 1.3rem;
      min-width: 28px;
      display: flex;
      justify-content: center;
    }

    .nav-label {
      flex: 1;
      font-weight: 500;
    }

    .indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff6b6b;
      margin-left: auto;
    }

    .progress-section {
      margin: 1rem 1.5rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 0.75rem;
    }

    .progress-header {
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      opacity: 0.9;
    }

    .progress-text {
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
      opacity: 0.8;
    }

    .progress-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: white;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .main-content {
      flex: 1;
      margin-left: 280px;
      min-height: 100vh;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 80px;
      }

      .logo-content {
        display: none;
      }

      .section-title,
      .nav-label,
      .progress-section {
        display: none;
      }

      .main-content {
        margin-left: 80px;
      }
    }

    /* Scrollbar customization */
    .sidebar-nav::-webkit-scrollbar {
      width: 5px;
    }

    .sidebar-nav::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
    }

    .sidebar-nav::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }

    .sidebar-nav::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  `]
})
export class LayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected menuPrincipal: MenuItem[] = [
    { icon: '📊', label: 'Dashboard', route: '/dashboard' },
    { icon: '🏢', label: 'Departamentos', route: '/departamentos' }
  ];

  protected lineamientos: LineamientoItem[] = [
    { numero: 1, nombre: 'Naturaleza y características', icono: '📚', route: '/lineamientos/1', indicator: true },
    { numero: 2, nombre: 'Acceso y admisión', icono: '🎓', route: '/lineamientos/2', indicator: true },
    { numero: 3, nombre: 'Administración académica', icono: '✨', route: '/lineamientos/3', indicator: true },
    { numero: 4, nombre: 'Profesores', icono: '👨‍🏫', route: '/lineamientos/4', indicator: true },
    { numero: 5, nombre: 'Procesos académicos', icono: '$', route: '/lineamientos/5', indicator: true }
  ];

  onLogout(): void {
    this.authService.logout();
  }
}
