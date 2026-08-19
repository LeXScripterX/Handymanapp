import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    // La ruta correcta es:
loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'operaciones',
    loadComponent: () => import('./pages/operaciones/operaciones.page').then( m => m.OperacionesPage)
  },
  {
    path: 'menu',
    loadComponent: () => import('./components/menu/menu.page').then( m => m.MenuPage)
  },
];
