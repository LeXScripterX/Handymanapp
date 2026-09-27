import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },

  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
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
