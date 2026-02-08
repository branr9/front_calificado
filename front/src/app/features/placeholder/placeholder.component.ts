import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder-container">
      <div class="placeholder-content">
        <span class="placeholder-icon">{{ icon() }}</span>
        <h1>{{ title() }}</h1>
        <p>Esta sección estará disponible próximamente</p>
        <div class="placeholder-info">
          <p>Actualmente estamos trabajando en esta funcionalidad.</p>
          <p>Por favor, vuelve más tarde.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .placeholder-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 2rem;
    }

    .placeholder-content {
      text-align: center;
      max-width: 500px;
    }

    .placeholder-icon {
      font-size: 6rem;
      display: block;
      margin-bottom: 1.5rem;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    h1 {
      color: #2c3e50;
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    p {
      color: #7f8c8d;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    .placeholder-info {
      margin-top: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .placeholder-info p {
      font-size: 0.95rem;
      line-height: 1.6;
    }
  `]
})
export class PlaceholderComponent {
  private route = inject(ActivatedRoute);

  protected title(): string {
    return this.route.snapshot.data['title'] || 'Próximamente';
  }
  
  protected icon(): string {
    return this.route.snapshot.data['icon'] || '🚧';
  }
}
