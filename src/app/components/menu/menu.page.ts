import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonMenu, 
  IonAvatar, 
  IonLabel, 
  IonList, 
  IonItem, 
  IonMenuToggle,
  IonIcon 
} from '@ionic/angular/standalone';

import { clipboardOutline, homeOutline, logInOutline, shieldCheckmarkOutline, logOutOutline, personOutline } from 'ionicons/icons';
import { AuthService, UserRole } from '../../services/auth.service';
import { addIcons } from 'ionicons';

interface ItemMenu {
  ruta: string;
  etiqueta: string;
  icono: string;
}

const RUTAS_INICIO: Record<UserRole, string> = {
  cliente: '/home-cliente',
  handyman: '/home-handyman',
  admin: '/admin'
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonMenu,
    IonAvatar,
    IonLabel,
    IonList,
    IonItem,
    IonMenuToggle,
    IonIcon
  ]
})
export class MenuPage {

private authService = inject(AuthService);
private router = inject(Router);


 nombre = signal('');
 rol = signal<UserRole>('cliente');
 inicial = computed(() => this.nombre().charAt(0).toUpperCase() || 'U');
 etiquetaRol = computed(() => {
  const etiquetas: Record<UserRole, string> = {
    cliente: 'Cliente',
    handyman: 'Handyman',
    admin: 'Administrador',
  }
  return etiquetas[this.rol()];
 });

 items = computed<ItemMenu[]>(() => {
    const base: ItemMenu[] = [
      { ruta: RUTAS_INICIO[this.rol()], etiqueta: 'Inicio', icono: 'home-outline' },
      { ruta: '/operaciones', etiqueta: 'Operaciones', icono: 'clipboard-outline' },
      { ruta: '/perfil', etiqueta: 'Perfil', icono: 'person-outline' },
    ];
    if (this.rol() === 'admin') {
      base.push({ ruta: '/admin', etiqueta: 'Panel admin', icono: 'shield-checkmark-outline' });
    }
    return base;
  });

     constructor() {
      addIcons({ clipboardOutline, homeOutline, logInOutline, personOutline, shieldCheckmarkOutline });
      this.cargarPerfil();
     }

 private async cargarPerfil() {
    const usuario = await firstValueFrom(this.authService.currentUser$);
    if (!usuario) return;
    const perfil = await this.authService.obtenerPerfil(usuario.uid);
    if (perfil) {
      this.nombre.set(perfil.nombre);
      this.rol.set(perfil.rol);
    }
  }

  ir(ruta: string) {
    this.router.navigateByUrl(ruta);
  }
  
  async cerrasrSession() {
    await this.authService.cerrarSesion();
    this.router.navigateByUrl('/login', { replaceUrl: true});
  }
}