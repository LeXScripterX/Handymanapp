import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonContent,
  IonIcon,
  MenuController,
  ToastController,
} from '@ionic/angular/standalone';
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
  closeOutline,
  waterOutline,
  flashOutline,
  hammerOutline,
  colorPaletteOutline,
  keyOutline,
  leafOutline,
  searchOutline,
  callOutline,
  logoWhatsapp,
  sendOutline,
  sparklesOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';
import {
  OperacionesHandymanService,
  ServicioMarketplace,
} from '../../../services/operaciones-handyman.service';
import { HeaderClienteComponent } from '../header-cliente/header-cliente.component';

@Component({
  selector: 'app-home',
  templateUrl: './home-cliente.page.html',
  styleUrls: ['./home-cliente.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonIcon,
    HeaderClienteComponent,
  ],
})
export class HomeCliente {
  private authService = inject(AuthService);
  private operacionesService = inject(OperacionesHandymanService);
  private menuCtrl = inject(MenuController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  nombre = signal('Cliente');
  fotoPerfil = signal('');
  telefonoCliente = signal('');
  zonaCliente = signal('Bogotá · Activo');

  busqueda = signal('');
  categoriaActiva = signal('todas');

  // Modal para crear solicitud en Firestore
  modalAbierto = signal(false);
  servicioSeleccionado = signal<ServicioMarketplace | null>(null);
  formMensaje = '';
  formDireccion = '';
  formBarrio = 'Chapinero';
  formPrecio: number | null = null;
  enviando = signal(false);

  servicios = this.operacionesService.serviciosMarketplace;
  misSolicitudes = this.operacionesService.solicitudesCliente;

  saludoInicial = computed(() => this.nombre().split(' ')[0] || 'Cliente');

  // 3 KPIs al estilo de home-handyman
  solicitudesActivasHoy = computed(() => {
    return this.misSolicitudes().filter(
      (s) => s.estado !== 'completada' && s.estado !== 'rechazada'
    ).length;
  });

  trabajosCompletadosTotal = computed(() => {
    return this.misSolicitudes().filter((s) => s.estado === 'completada').length;
  });

  profesionalesDisponibles = computed(() => {
    return this.servicios().length;
  });

  categorias = [
    { id: 'todas', nombre: 'Todos', icono: 'sparkles-outline' },
    { id: 'plomería', nombre: 'Plomería', icono: 'water-outline' },
    { id: 'electricidad', nombre: 'Electricidad', icono: 'flash-outline' },
    { id: 'carpintería', nombre: 'Carpintería', icono: 'hammer-outline' },
    { id: 'pintura', nombre: 'Pintura', icono: 'color-palette-outline' },
    { id: 'cerrajería', nombre: 'Cerrajería', icono: 'key-outline' },
    { id: 'jardinería', nombre: 'Jardinería', icono: 'leaf-outline' },
  ];

  serviciosFiltrados = computed(() => {
    const cat = this.categoriaActiva().toLowerCase();
    const q = this.busqueda().trim().toLowerCase();

    return this.servicios().filter((s) => {
      const coincideCat = cat === 'todas' || (s.categoria || '').toLowerCase() === cat;
      const coincideTexto =
        !q ||
        s.titulo.toLowerCase().includes(q) ||
        s.descripcion.toLowerCase().includes(q) ||
        (s.handymanNombre || '').toLowerCase().includes(q) ||
        s.categoria.toLowerCase().includes(q);
      return coincideCat && coincideTexto;
    });
  });

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
      closeOutline,
      waterOutline,
      flashOutline,
      hammerOutline,
      colorPaletteOutline,
      keyOutline,
      leafOutline,
      searchOutline,
      callOutline,
      logoWhatsapp,
      sendOutline,
      sparklesOutline,
      checkmarkCircleOutline
    });
  }

  async ionViewWillEnter() {
    this.menuCtrl.enable(window.matchMedia('(min-width: 992px)').matches);

    const usuario = await firstValueFrom(this.authService.currentUser$);
    if (!usuario) return;

    const perfil = await this.authService.obtenerPerfil(usuario.uid);
    if (perfil) {
      if (perfil.nombre) this.nombre.set(perfil.nombre);
      if (perfil.fotoUrl) this.fotoPerfil.set(perfil.fotoUrl);
      if (perfil.telefono) this.telefonoCliente.set(perfil.telefono);
    }

    await Promise.all([
      this.operacionesService.cargarCatalogoServicios(),
      this.operacionesService.cargarSolicitudesCliente(),
    ]);
  }

  seleccionarCategoria(catId: string) {
    this.categoriaActiva.set(catId);
  }

  abrirModalSolicitar(serv: ServicioMarketplace) {
    this.servicioSeleccionado.set(serv);
    this.formMensaje = '';
    this.formDireccion = '';
    this.formBarrio = 'Chapinero';
    this.formPrecio = serv.precio;
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    this.servicioSeleccionado.set(null);
  }

  async enviarSolicitud() {
    const serv = this.servicioSeleccionado();
    if (!serv) return;

    const msg = this.formMensaje.trim();
    if (msg.length < 10) {
      await this.mostrarToast('Describe el trabajo que necesitas (mínimo 10 caracteres)');
      return;
    }

    if (!this.formDireccion.trim()) {
      await this.mostrarToast('Ingresa la dirección del servicio');
      return;
    }

    this.enviando.set(true);
    try {
      await this.operacionesService.crearSolicitudCliente({
        servicioId: serv.id,
        mensaje: msg,
        direccion: this.formDireccion.trim(),
        ubicacionDetalle: this.formBarrio.trim() || 'Bogotá',
        precio: this.formPrecio && this.formPrecio > 0 ? Number(this.formPrecio) : serv.precio,
        clienteTelefono: this.telefonoCliente() || '3000000000',
      });

      this.cerrarModal();
      await this.mostrarToast('¡Solicitud enviada al Handyman!');
      this.router.navigate(['/operaciones-cliente']);
    } catch (e: any) {
      const detalle = e?.error?.detail || 'No se pudo crear la solicitud';
      await this.mostrarToast(detalle);
    } finally {
      this.enviando.set(false);
    }
  }

  llamarHandyman(telefono?: string) {
    window.open(`tel:${telefono || '3000000000'}`, '_self');
  }

  formatearPrecio(valor?: number): string {
    return '$' + Number(valor || 0).toLocaleString('es-CO');
  }

  private async mostrarToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'dark',
    });
    await toast.present();
  }
}

