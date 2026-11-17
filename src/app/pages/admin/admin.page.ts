import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
export class AdminPage implements OnInit {
  private alertCtrl = inject(AlertController);
  private authService = inject(AuthService);
  private router = inject(Router);
  admin = inject(AdminService);

  vista = signal<Vista>('resumen');
  busqueda = signal('');

  usuariosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    return this.admin.usuarios().filter(
      (u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

 // Estadísticas reales del backend
estadisticas = this.admin.estadisticas;
errorEstadisticas = this.admin.errorEstadisticas;

stats = computed(() => {
  const r = this.admin.estadisticas()?.resumen;
  return {
    trabajadores: r?.trabajadores ?? 0,
    clientes: r?.clientes ?? 0,
    sinVerificar: r?.trabajadores_sin_verificar ?? 0,
    verificados: r?.trabajadores_verificados ?? 0,
    activos: r?.activos ?? 0,
    inactivos: r?.inactivos ?? 0,
    nuevos7dias: r?.registrados_ultimos_7_dias ?? 0,
    totalUsuarios: r?.total_usuarios ?? 0,
    resenasPendientes: this.admin.resenas().filter((x) => x.estado === 'pendiente').length,
  };
});

porCategoria = computed(() => this.admin.estadisticas()?.por_categoria ?? []);

  resenasPendientes = computed(() =>
    this.admin.resenas().filter((r) => r.estado === 'pendiente')
  );


  ngOnInit() {
  this.admin.cargarEstadisticas();
  this.admin.cargarUsuarios();
  }

  cambiarVista(ev: any) {
    this.vista.set(ev.detail.value);
  }

  reintentar() {
  this.admin.cargarEstadisticas();
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