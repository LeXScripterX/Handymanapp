import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.services';

type Vista = 'resumen' | 'usuarios' | 'servicios' | 'resenas';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonSegment, IonSegmentButton, IonLabel,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonSearchbar, IonList, IonItem, IonChip, IonToggle,
  ],
})
export class AdminPage {
  private alertCtrl = inject(AlertController);
  admin = inject(AdminService);

  vista = signal<Vista>('resumen');
  busqueda = signal('');

  usuariosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    return this.admin.usuarios().filter(
      (u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  stats = computed(() => ({
    trabajadores: this.admin.usuarios().filter((u) => u.rol === 'trabajador').length,
    clientes: this.admin.usuarios().filter((u) => u.rol === 'cliente').length,
    sinVerificar: this.admin.usuarios().filter((u) => u.rol === 'trabajador' && !u.verificado).length,
    resenasPendientes: this.admin.resenas().filter((r) => r.estado === 'pendiente').length,
  }));

  resenasPendientes = computed(() =>
    this.admin.resenas().filter((r) => r.estado === 'pendiente')
  );

  constructor(private authService: AuthService, private router: Router) {}

  cambiarVista(ev: any) {
    this.vista.set(ev.detail.value);
  }

  async nuevoServicio() {
    const alert = await this.alertCtrl.create({
      header: 'Nuevo servicio',
      inputs: [{ name: 'nombre', placeholder: 'Ej: Pintor' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: (d) => {
            const nombre = (d.nombre ?? '').trim();
            if (nombre) this.admin.agregarServicio(nombre);
          },
        },
      ],
    });
    await alert.present();
  }

  async confirmarEliminar(id: string, nombre: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar servicio',
      message: `¿Eliminar "${nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.admin.eliminarServicio(id) },
      ],
    });
    await alert.present();
  }

  async cerrarSesion() {
    await this.authService.cerrarSesion();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}