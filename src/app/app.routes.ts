import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

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
    path: 'home-cliente',
    loadComponent: () => import('./pages/home-cliente/home-cliente.page').then((m) => m.HomeCliente),
  },
  {
    path: 'home-handyman',
    loadComponent: () => import('./pages/HandyMan/home-handyman/home-handyman.page').then((m) => m.HomeHandymanPage),
  },
  {
    path: 'operaciones-handyman',
    loadComponent: () => import('./pages/HandyMan/operaciones-handyman/operaciones-handyman.page').then( m => m.OperacionesHandymanPage)
  },
  {
    path: 'perfil-handyman',
    loadComponent: () => import('./pages/HandyMan/perfil-handyman/perfil-handyman.page').then( m => m.PerfilHandymanPage)
  },
  {
    path: 'menu',
    loadComponent: () => import('./components/menu/menu.page').then( m => m.MenuPage)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then( m => m.AdminPage)
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage),
  },
];
