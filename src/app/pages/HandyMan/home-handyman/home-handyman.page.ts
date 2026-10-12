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

// 1. IMPORTAMOS EL NUEVO COMPONENTE COMPARTIDO
import { HeaderHandymanComponent } from '../header-handyman/header-handyman.component';

interface Solicitud {
  cliente: string;
  servicio: string;
  categoriaZona: string;
  precio: string;
  distancia: string;
  hace: string;
}

interface TrabajoCompletadoHoy {
  id: number;
  servicio: string;
  monto: number;
  calificacion: number;
}

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
    HeaderHandymanComponent // 2. LO AGREGAMOS A LOS IMPORTS DEL COMPONENTE
  ]
})
export class HomeHandymanPage {
  private authService = inject(AuthService);
  private menuCtrl = inject(MenuController);
  private router = inject(Router);

  nombre = signal('Daniel');
  fotoPerfil = signal('');
  disponible = signal(true);

  // Trabajos finalizados del día actual (listos para mapear a Firebase)
  trabajosFinalizadosHoy = signal<TrabajoCompletadoHoy[]>([
    { id: 1, servicio: 'Instalación de tomacorrientes', monto: 50000, calificacion: 5 },
    { id: 2, servicio: 'Reparación de grifo', monto: 35000, calificacion: 4.8 },
  ]);

  // Cálculos automáticos del día actual
  gananciasHoy = computed(() => {
    return this.trabajosFinalizadosHoy().reduce((acc, t) => acc + t.monto, 0);
  });

  trabajosCompletadosHoy = computed(() => {
    return this.trabajosFinalizadosHoy().length;
  });

  calificacionPromedioHoy = computed(() => {
    const lista = this.trabajosFinalizadosHoy();
    if (lista.length === 0) return 0;
    const suma = lista.reduce((acc, t) => acc + t.calificacion, 0);
    return Number((suma / lista.length).toFixed(1));
  });

  solicitudes = signal<Solicitud[]>([
    { 
      cliente: 'María Torres', 
      servicio: 'Fuga en el baño', 
      categoriaZona: 'Plomería · Chapinero', 
      precio: '$85.000', 
      distancia: '1.8 km', 
      hace: 'hace 5 min' 
    },
    { 
      cliente: 'Jorge Lemus', 
      servicio: 'Cambio de tomacorriente', 
      categoriaZona: 'Electricidad · Usaquén', 
      precio: '$60.000', 
      distancia: '3.1 km', 
      hace: 'hace 12 min' 
    },
  ]);

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
      if (perfil.fotoPerfil) {
        this.fotoPerfil.set(perfil.fotoPerfil);
      }
    }
  }

  alternarDisponibilidad() {
    this.disponible.update((v) => !v);
  }

  aceptar(solicitud: Solicitud) {
    this.solicitudes.update((lista) => lista.filter((s) => s !== solicitud));
    // Al aceptar la solicitud navega directamente a la pestaña de operaciones
    this.router.navigate(['/operaciones-handyman']);
  }

  rechazar(solicitud: Solicitud) {
    this.solicitudes.update((lista) => lista.filter((s) => s !== solicitud));
  }
}
