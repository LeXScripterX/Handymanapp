import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonToolbar,
  MenuController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  constructOutline,
  locationOutline,
  notificationsOutline,
  star,
  timeOutline,
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { DecimalPipe } from '@angular/common';

interface Solicitud {
  cliente: string;
  servicio: string;
  distancia: string;
  hace: string;
}

interface Trabajo {
  cliente: string;
  servicio: string;
  estado: 'En camino' | 'En progreso';
}

@Component({
  selector: 'app-home-handyman',
  templateUrl: './home-handyman.page.html',
  styleUrls: ['./home-handyman.page.scss'],
  standalone: true,
  imports: [IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonToolbar, DecimalPipe]
})
export class HomeHandymanPage {
  private authService = inject(AuthService);
  private menuCtrl = inject(MenuController);

  nombre = signal('');
  disponible = signal(true);

  // Datos de ejemplo: luego se reemplazan por los reales de Firestore.
  gananciasHoy = signal(85000);
  trabajosCompletados = signal(4);
  calificacion = signal(4.8);

  solicitudes = signal<Solicitud[]>([
    { cliente: 'María Torres', servicio: 'Cambio de tomacorriente', distancia: '1.1 km', hace: 'hace 5 min' },
    { cliente: 'Jorge Lemus', servicio: 'Fuga de agua en cocina', distancia: '2.3 km', hace: 'hace 12 min' },
  ]);

  trabajosEnCurso = signal<Trabajo[]>([
    { cliente: 'Sofía Ramírez', servicio: 'Instalación de repisas', estado: 'En camino' },
  ]);

  saludoInicial = computed(() => this.nombre().split(' ')[0] || '');

  constructor() {
    addIcons({ cashOutline, constructOutline, locationOutline, notificationsOutline, star, timeOutline });
  }

  async ionViewWillEnter() {
    this.menuCtrl.enable(window.matchMedia('(min-width: 992px)').matches);

    const usuario = await firstValueFrom(this.authService.currentUser$);
    if (!usuario) return;

    const perfil = await this.authService.obtenerPerfil(usuario.uid);
    if (perfil) {
      this.nombre.set(perfil.nombre);
    }
  }

  alternarDisponibilidad() {
    this.disponible.update((v) => !v);
  }

  aceptar(solicitud: Solicitud) {
    this.solicitudes.update((lista) => lista.filter((s) => s !== solicitud));
    this.trabajosEnCurso.update((lista) => [
      ...lista,
      { cliente: solicitud.cliente, servicio: solicitud.servicio, estado: 'En camino' },
    ]);
  }

  rechazar(solicitud: Solicitud) {
    this.solicitudes.update((lista) => lista.filter((s) => s !== solicitud));
  }
}
