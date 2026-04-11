import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
    // Sin canActivate para mostrar el form de inmediato
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'programas',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/programas/programa-list.component').then(m => m.ProgramaListComponent)
          },
          {
            path: 'nuevo',
            loadComponent: () => import('./features/programas/programa-form.component').then(m => m.ProgramaFormComponent)
          },
          {
            path: 'editar/:id',
            loadComponent: () => import('./features/programas/programa-form.component').then(m => m.ProgramaFormComponent)
          },
          {
            path: ':programaId/lineamiento/:numero',
            loadComponent: () => import('./features/programas/lineamiento-detail.component').then(m => m.LineamientoDetailComponent)
          },
          {
            path: ':programaId/lineamiento/:numero/componente/:componente',
            loadComponent: () => import('./features/programas/lineamiento-detail.component').then(m => m.LineamientoDetailComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/programas/programa-detail.component').then(m => m.ProgramaDetailComponent)
          }
        ]
      },
      {
        path: 'usuarios',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/usuarios/usuario-list.component').then(m => m.UsuarioListComponent)
          },
          {
            path: 'nuevo',
            loadComponent: () => import('./features/usuarios/usuario-form.component').then(m => m.UsuarioFormComponent)
          },
          {
            path: 'editar/:id',
            loadComponent: () => import('./features/usuarios/usuario-form.component').then(m => m.UsuarioFormComponent)
          }
        ]
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
