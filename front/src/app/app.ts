import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontRegistro');

  constructor() {
    const platformId = inject(PLATFORM_ID);
    // Limpiar localStorage corruptos en modo incógnito o primera carga
    if (isPlatformBrowser(platformId)) {
      try {
        const user = localStorage.getItem('rc_user');
        if (user) {
          JSON.parse(user);
        }
      } catch {
        // Si hay JSON corruptos, limpiar todo
        localStorage.clear();
      }
    }
  }
}
