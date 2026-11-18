import { Component, signal, computed, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  star,
  timeOutline,
  personOutline,
  notificationsOutline,
  homeOutline,
  clipboardOutline,
  radioButtonOnOutline,
  fileTrayOutline,
  chevronDownOutline,
  chevronUpOutline,
  cameraOutline,
  imageOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  callOutline,
  logoWhatsapp,
  constructOutline,
  carOutline,
  sendOutline,
  chatbubbleEllipsesOutline,
  sparklesOutline,
  locationOutline,
} from 'ionicons/icons';

import { HeaderClienteComponent } from '../header-cliente/header-cliente.component';
import {
  OperacionesHandymanService,
  SolicitudClienteApi,
  EntradaBitacora,
} from '../../../services/operaciones-handyman.service';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

interface GrupoSolicitudesFecha {
  fechaOriginal: string;
  fechaFormateada: string;
  solicitudes: SolicitudClienteApi[];
}

@Component({
  selector: 'app-operaciones-cliente',
  templateUrl: './operaciones-cliente.page.html',
  styleUrls: ['./operaciones-cliente.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule,
    HeaderClienteComponent,
  ],
})
export class OperacionesClientePage {
  private toastCtrl = inject(ToastController);
  private operacionesService = inject(OperacionesHandymanService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  nombreCliente = signal<string>('Cliente');
  fotoPerfil = signal<string>('');

  solicitudExpandidaId = signal<string | null>(null);
  mensajeClienteTemporal: Record<string, string> = {};
  calificacionTemporal: Record<string, number> = {};

  listaSolicitudes = this.operacionesService.solicitudesCliente;

  filtroEstado = signal<string>('todos');
  filtroFecha = signal<string>('');

  constructor() {
    addIcons({
      star,
      timeOutline,
      personOutline,
      notificationsOutline,
      homeOutline,
      clipboardOutline,
      radioButtonOnOutline,
      fileTrayOutline,
      chevronDownOutline,
      chevronUpOutline,
      cameraOutline,
      imageOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      callOutline,
      logoWhatsapp,
      constructOutline,
      carOutline,
      sendOutline,
      chatbubbleEllipsesOutline,
      sparklesOutline,
      locationOutline,
    });
  }

  async ionViewWillEnter() {
    const usuario = await firstValueFrom(this.authService.currentUser$);
    if (usuario) {
      const perfil = await this.authService.obtenerPerfil(usuario.uid);
      if (perfil) {
        this.nombreCliente.set(perfil.nombre.split(' ')[0]);
        if (perfil.fotoUrl) this.fotoPerfil.set(perfil.fotoUrl);
      }
    }

    await this.operacionesService.cargarSolicitudesCliente();
    const lista = this.listaSolicitudes();
    if (lista.length > 0 && !this.solicitudExpandidaId()) {
      this.solicitudExpandidaId.set(lista[0].id);
    }
  }

  // Contadores KPI idénticos a operaciones-handyman
  totalNuevos = computed(() => {
    return this.listaSolicitudes().filter(
      (s) => s.estado === 'pendiente' || s.estado === 'aceptada'
    ).length;
  });

  totalEnCamino = computed(() => {
    return this.listaSolicitudes().filter((s) => s.estado === 'en_camino').length;
  });

  totalEnCurso = computed(() => {
    return this.listaSolicitudes().filter((s) => s.estado === 'en_curso').length;
  });

  filtroFechaLegible = computed(() => {
    const val = this.filtroFecha();
    if (!val) return 'Fecha';
    const partes = val.split('-');
    if (partes.length === 3) {
      const [anio, mes, dia] = partes;
      return `${dia}/${mes}/${anio}`;
    }
    return val;
  });

  private extraerFechaStr(isoStr?: string): string {
    const optionsTime: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const d = isoStr ? new Date(isoStr) : new Date();
    const valida = isNaN(d.getTime()) ? new Date() : d;
    return new Intl.DateTimeFormat('en-CA', optionsTime).format(valida);
  }

  obtenerHoraLegible(isoStr?: string): string {
    const d = isoStr ? new Date(isoStr) : new Date();
    if (isNaN(d.getTime())) return 'Hoy';
    return d.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  private obtenerFechaFormateada(fechaStr: string): string {
    const optionsTime: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const hoyStr = new Intl.DateTimeFormat('en-CA', optionsTime).format(new Date());

    const fechaHoy = new Date(hoyStr + 'T00:00:00');
    const fechaAyerObj = new Date(fechaHoy);
    fechaAyerObj.setDate(fechaHoy.getDate() - 1);
    const ayerStr = new Intl.DateTimeFormat('en-CA', optionsTime).format(fechaAyerObj);

    if (fechaStr === hoyStr) {
      return 'HOY';
    } else if (fechaStr === ayerStr) {
      return 'AYER';
    } else {
      const [anio, mes, dia] = fechaStr.split('-').map(Number);
      const fechaObj = new Date(anio, mes - 1, dia);
      const opcionesTexto: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return fechaObj.toLocaleDateString('es-CO', opcionesTexto).toUpperCase();
    }
  }

  solicitudesAgrupadasPorFecha = computed<GrupoSolicitudesFecha[]>(() => {
    let lista = this.listaSolicitudes();
    const estado = this.filtroEstado();
    const fechaFiltro = this.filtroFecha();

    if (estado !== 'todos') {
      if (estado === 'NUEVO') {
        lista = lista.filter((s) => s.estado === 'pendiente' || s.estado === 'aceptada');
      } else if (estado === 'En camino') {
        lista = lista.filter((s) => s.estado === 'en_camino');
      } else if (estado === 'En curso') {
        lista = lista.filter((s) => s.estado === 'en_curso');
      } else if (estado === 'Finalizado') {
        lista = lista.filter((s) => s.estado === 'completada');
      }
    }

    if (fechaFiltro) {
      lista = lista.filter((s) => this.extraerFechaStr(s.creado) === fechaFiltro);
    }

    const mapa = new Map<string, SolicitudClienteApi[]>();
    for (const s of lista) {
      const f = this.extraerFechaStr(s.creado);
      if (!mapa.has(f)) {
        mapa.set(f, []);
      }
      mapa.get(f)!.push(s);
    }

    const grupos: GrupoSolicitudesFecha[] = [];
    mapa.forEach((items, fechaOriginal) => {
      grupos.push({
        fechaOriginal,
        fechaFormateada: this.obtenerFechaFormateada(fechaOriginal),
        solicitudes: items,
      });
    });

    grupos.sort((a, b) => b.fechaOriginal.localeCompare(a.fechaOriginal));
    return grupos;
  });

  alternarExpansion(id: string) {
    if (this.solicitudExpandidaId() === id) {
      this.solicitudExpandidaId.set(null);
    } else {
      this.solicitudExpandidaId.set(id);
      if (!this.calificacionTemporal[id]) {
        this.calificacionTemporal[id] = 5;
      }
    }
  }

  obtenerEtiquetaEstadoUi(estadoApi: string): string {
    switch (estadoApi) {
      case 'pendiente':
        return 'NUEVO (PENDIENTE)';
      case 'aceptada':
        return 'NUEVO';
      case 'en_camino':
        return 'En camino';
      case 'en_curso':
        return 'En curso';
      case 'completada':
        return 'Finalizado';
      case 'rechazada':
        return 'Rechazado';
      default:
        return estadoApi;
    }
  }

  obtenerClaseEstado(estadoApi: string): string {
    switch (estadoApi) {
      case 'pendiente':
      case 'aceptada':
        return 'badge-nuevo';
      case 'en_camino':
        return 'badge-camino';
      case 'en_curso':
        return 'badge-curso';
      case 'completada':
        return 'badge-finalizado';
      default:
        return '';
    }
  }

  obtenerPasoActual(estadoApi: string): number {
    switch (estadoApi) {
      case 'pendiente':
      case 'aceptada':
        return 1;
      case 'en_camino':
        return 2;
      case 'en_curso':
        return 3;
      case 'completada':
        return 4;
      default:
        return 1;
    }
  }

  obtenerBitacora(s: SolicitudClienteApi): EntradaBitacora[] {
    return s.bitacora || [];
  }

  async enviarMensajeBitacoraCliente(sol: SolicitudClienteApi, event?: Event) {
    if (event) event.stopPropagation();
    const texto = (this.mensajeClienteTemporal[sol.id] || '').trim();
    if (!texto) {
      await this.mostrarNotificacion('Escribe un mensaje para el Handyman');
      return;
    }

    const hora = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const nuevaEntrada: EntradaBitacora = {
      id: Date.now(),
      texto: `Cliente (${this.nombreCliente()}): ${texto}`,
      hora,
      tipo: 'nota',
    };

    const bitacoraActualizada = [...this.obtenerBitacora(sol), nuevaEntrada];

    try {
      const token = await this.authService.getIdToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      await firstValueFrom(
        this.http.patch(
          `${environment.apiUrl}/solicitudes/${sol.id}/estado`,
          { bitacora: bitacoraActualizada },
          { headers }
        )
      );

      this.mensajeClienteTemporal[sol.id] = '';
      await this.operacionesService.cargarSolicitudesCliente();
      this.cdr.detectChanges();
      await this.mostrarNotificacion('Mensaje enviado a la bitácora del Handyman');
    } catch (e) {
      await this.mostrarNotificacion('No se pudo guardar el mensaje');
    }
  }

  seleccionarEstrellas(solId: string, num: number, event: Event) {
    event.stopPropagation();
    this.calificacionTemporal[solId] = num;
  }

  async confirmarServicioCompletado(sol: SolicitudClienteApi, event: Event) {
    event.stopPropagation();
    const estrellas = this.calificacionTemporal[sol.id] || 5;
    try {
      await this.operacionesService.confirmarFinalizacionCliente(sol.id, estrellas);
      await this.mostrarNotificacion('¡Servicio finalizado y calificado!');
    } catch (e) {
      await this.mostrarNotificacion('Error al finalizar el servicio');
    }
  }

  llamarHandyman(telefono?: string, event?: Event) {
    if (event) event.stopPropagation();
    window.open(`tel:${telefono || '3000000000'}`, '_self');
  }

  escribirWhatsApp(sol: SolicitudClienteApi, event: Event) {
    event.stopPropagation();
    const num = (sol.handymanTelefono || '3000000000').replace(/[^0-9]/g, '');
    const prefijo = num.startsWith('57') ? num : `57${num}`;
    const msg = encodeURIComponent(
      `Hola ${sol.handymanNombre || ''}, te escribo por mi solicitud de "${sol.servicioTitulo}" en ${sol.direccion}.`
    );
    window.open(`https://wa.me/${prefijo}?text=${msg}`, '_blank');
  }

  cambiarFiltro(estado: string) {
    this.filtroEstado.set(estado);
  }

  filtrarPorFecha(event: any) {
    this.filtroFecha.set(event?.target?.value || '');
  }

  abrirSelectorFecha(input: HTMLInputElement) {
    if (!input) return;
    try {
      if ('showPicker' in HTMLInputElement.prototype) {
        input.showPicker();
      } else {
        input.focus();
        input.click();
      }
    } catch {
      input.focus();
      input.click();
    }
  }

  limpiarFecha() {
    this.filtroFecha.set('');
  }

  formatearPrecio(valor?: number): string {
    return '$' + Number(valor || 0).toLocaleString('es-CO');
  }

  private async mostrarNotificacion(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: 'dark',
    });
    await toast.present();
  }
}