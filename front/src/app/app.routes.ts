import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'programas',
        loadComponent: () => import('./features/programas/programa-list.component').then(m => m.ProgramaListComponent)
      },
      {
        path: 'programas/nuevo',
        loadComponent: () => import('./features/programas/programa-form.component').then(m => m.ProgramaFormComponent)
      },
      {
        path: 'programas/editar/:id',
        loadComponent: () => import('./features/programas/programa-form.component').then(m => m.ProgramaFormComponent)
      },
      {
        path: 'programas/:id/lineamiento/:lineamiento',
        loadComponent: () => import('./features/programas/lineamiento-detail.component').then(m => m.LineamientoDetailComponent)
      },
      {
        path: 'programas/:id',
        loadComponent: () => import('./features/programas/programa-detail.component').then(m => m.ProgramaDetailComponent)
      },
      {
        path: 'acreditaciones',
        loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        data: { title: 'Acreditaciones', icon: '📝' }
      },
      {
        path: 'documentos',
        loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        data: { title: 'Documentos', icon: '📄' }
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { title: 'Usuarios', icon: '👥', roles: ['ADMINISTRADOR'] },
        loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
      
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        data: { title: 'Configuración', icon: '⚙️' }
      },
      {
        path: 'lineamientos/:id',
        loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        data: { title: 'Lineamiento', icon: '📚' }
      },
      {
        path: 'documento-final',
        loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        data: { title: 'Documento Final', icon: '📄' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
