import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  IonContent,
  IonIcon,
  MenuController,
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  constructOutline,
  locationOutline,
  notificationsOutline,
  star,
  timeOutline,
  homeOutline,
  clipboardOutline,
  personOutline,
  fileTrayOutline,
  checkmarkOutline,
  closeOutline
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';
import { DecimalPipe } from '@angular/common';

import { HeaderHandymanComponent } from '../header-handyman/header-handyman.component';
import { OperacionesHandymanService, SolicitudPendienteHome } from '../../../services/operaciones-handyman.service';

@Component({
  selector: 'app-home-handyman',
  templateUrl: './home-handyman.page.html',
  styleUrls: ['./home-handyman.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    DecimalPipe,
    RouterModule,
    HeaderHandymanComponent 
  ]
})
export class HomeHandymanPage {
  private authService = inject(AuthService);
  private menuCtrl = inject(MenuController);
  private router = inject(Router);
  private operacionesService = inject(OperacionesHandymanService);

  nombre = signal('Daniel');
  fotoPerfil = signal('');
  disponible = signal(true);

  // Solicitudes entrantes en tiempo real desde la BD (estado 'pendiente')
  solicitudes = this.operacionesService.solicitudesPendientes;

  // Trabajos completados reales obtenidos de la BD
  trabajosFinalizadosHoy = computed(() => {
    return this.operacionesService
      .listaTrabajos()
      .filter(t => t.estado === 'Finalizado')
      .map(t => ({
        id: t.id,
        servicio: t.servicio,
        monto: t.precioNumerico || Number(String(t.precio).replace(/[^0-9]/g, '')) || 0,
        calificacion: t.estrellas || 5
      }));
  });

  gananciasHoy = computed(() => {
    return this.trabajosFinalizadosHoy().reduce((acc, t) => acc + t.monto, 0);
  });

  trabajosCompletadosHoy = computed(() => {
    return this.trabajosFinalizadosHoy().length;
  });

  calificacionPromedioHoy = computed(() => {
    const lista = this.trabajosFinalizadosHoy();
    if (lista.length === 0) return 5.0;
    const suma = lista.reduce((acc, t) => acc + t.calificacion, 0);
    return Number((suma / lista.length).toFixed(1));
  });

  saludoInicial = computed(() => this.nombre().split(' ')[0] || '');

  constructor() {
    addIcons({ 
      cashOutline, 
      constructOutline, 
      locationOutline, 
      notificationsOutline, 
      star, 
      timeOutline, 
      homeOutline, 
      clipboardOutline, 
      personOutline,
      fileTrayOutline,
      checkmarkOutline,
      closeOutline
    });
  }

  async ionViewWillEnter() {
    this.menuCtrl.enable(window.matchMedia('(min-width: 992px)').matches);

    const usuario = await firstValueFrom(this.authService.currentUser$) as any;
    if (!usuario) return;

    const perfil = await this.authService.obtenerPerfil(usuario.uid) as any;
    if (perfil) {
      if (perfil.nombre) {
        this.nombre.set(perfil.nombre);
      }
      if (perfil.fotoUrl || perfil.fotoPerfil) {
        this.fotoPerfil.set(perfil.fotoUrl || perfil.fotoPerfil);
      }
      if (perfil.disponible !== undefined) {
        this.disponible.set(perfil.disponible);
      }
    }

    // Carga las solicitudes reales dirigidas a este Handyman desde FastAPI
    await this.operacionesService.cargarDatosHandyman();
  }

  async alternarDisponibilidad() {
    const nuevoValor = !this.disponible();
    this.disponible.set(nuevoValor);
    try {
      await this.authService.actualizarPerfilApi({ disponible: nuevoValor });
    } catch (e) {
      console.warn('No se pudo actualizar disponibilidad en API:', e);
    }
  }

  async aceptar(solicitud: SolicitudPendienteHome) {
    await this.operacionesService.aceptarSolicitud(solicitud);
    this.router.navigate(['/operaciones-handyman']);
  }

  async rechazar(solicitud: SolicitudPendienteHome) {
    await this.operacionesService.rechazarSolicitud(solicitud.id);
  }
}