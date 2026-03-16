import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
  icon: SafeHtml;
  label: string;
  route: string;
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
            <span class="logo-icon" [innerHTML]="logoIcon"></span>
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
                <span class="nav-icon" [innerHTML]="item.icon"></span>
                <span class="nav-label">{{ item.label }}</span>
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
            <span class="nav-icon" [innerHTML]="logoutIcon"></span>
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
      width: 42px;
      height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ffd56c;
      flex-shrink: 0;
      line-height: 0;
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
      min-width: 28px;
      width: 28px;
      height: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0.95;
      line-height: 0;
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
  private sanitizer = inject(DomSanitizer);

  protected logoIcon = this.svg(
    '<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2" width="18" height="20" rx="2" ry="2"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="18" x2="13" y2="18"/></svg>'
  );

  protected logoutIcon = this.svg(
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
  );

  protected menuPrincipal: MenuItem[] = [
    {
      icon: this.svg('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'),
      label: 'Dashboard',
      route: '/dashboard'
    },
    {
      icon: this.svg('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="7" rx="1"/><rect x="14" y="4" width="7" height="7" rx="1"/><rect x="14" y="13" width="7" height="7" rx="1"/><rect x="3" y="13" width="7" height="7" rx="1"/></svg>'),
      label: 'Programas',
      route: '/programas'
    }
  ];

  private svg(markup: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(markup);
  }


  onLogout(): void {
    this.authService.logout();
  }
}
