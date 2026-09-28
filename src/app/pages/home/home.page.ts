import { Component, computed, inject,signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { colorPaletteOutline, flashOutline, logoAndroid, notificationsOutline } from 'ionicons/icons';
import { 
  IonHeader, 
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonContent, 
  IonIcon,
  MenuController,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons'
import { colorPalette, constructOutline, flashOffOutline, hammerOutline,
         keyOutline, leafOutline, notifications, star, waterOutline,
 } from 'ionicons/icons';
import { AuthService, UserRole } from '../../services/auth.service';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonMenuButton, 
    IonContent, 
    IonIcon,
    IonTitle
  ],
})
export class HomePage {

private authService = inject(AuthService);
  private menuCtrl = inject(MenuController);

    nombre = signal('');
  rol = signal<UserRole>('cliente');
  etiquetaRol = computed(() => {
    const etiquetas: Record<UserRole, string> = {
      cliente: 'Cliente',
      handyman: 'Handyman',
      admin: 'Admin',
    };
    return etiquetas[this.rol()];
  });

  categorias = [
    { nombre: 'Plomería', icono: 'water-outline' },
    { nombre: 'Electricidad', icono: 'flash-outline' },
    { nombre: 'Carpintería', icono: 'hammer-outline' },
    { nombre: 'Pintura', icono: 'color-palette-outline' },
    { nombre: 'Cerrajería', icono: 'key-outline' },
    { nombre: 'Jardinería', icono: 'leaf-outline' },
  ];

    // Datos de ejemplo: luego se reemplazan por los handymen reales de Firestore.
  handymen = [
    { nombre: 'Carlos Ruiz', oficio: 'Electricista', calificacion: 4.9, distancia: '1.2 km' },
    { nombre: 'Andrea Gómez', oficio: 'Plomera', calificacion: 4.8, distancia: '2.0 km' },
    { nombre: 'Luis Pardo', oficio: 'Carpintero', calificacion: 4.7, distancia: '3.4 km' },
  ];
  constructor() {
    addIcons({  
      colorPaletteOutline,
      constructOutline,
      flashOutline,
      hammerOutline,
      keyOutline,
      leafOutline,
      notificationsOutline,
      star,
      waterOutline,
    });
  }

 async ionViewWillEnter() {
    // El menú lateral solo existe en web/PC; en móvil se navega con los tabs.
    this.menuCtrl.enable(window.matchMedia('(min-width: 992px)').matches);

    const usuario = await firstValueFrom(this.authService.currentUser$);
    if (!usuario) return;

    const perfil = await this.authService.obtenerPerfil(usuario.uid);
    if (perfil) {
      this.nombre.set(perfil.nombre.split(' ')[0]);
      this.rol.set(perfil.rol);
    }
  }


}

