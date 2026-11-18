import { Component, signal, computed, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
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
  trashOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  callOutline,
  navigateOutline,
  constructOutline,
  carOutline,
  saveOutline,
  sendOutline,
  chatbubbleEllipsesOutline,
  sparklesOutline,
  closeCircleOutline
} from 'ionicons/icons';

import { HeaderHandymanComponent } from '../header-handyman/header-handyman.component';
import { OperacionesHandymanService, TrabajoOperacion, EstadoTrabajo, EntradaBitacora } from '../../../services/operaciones-handyman.service';
import { AuthService } from '../../../services/auth.service';

interface GrupoTrabajosPorFecha {
  fechaOriginal: string;
  fechaFormateada: string;
  trabajos: TrabajoOperacion[];
}

@Component({
  selector: 'app-operaciones-handyman',
  templateUrl: './operaciones-handyman.page.html',
  styleUrls: ['./operaciones-handyman.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, HeaderHandymanComponent]
})
export class OperacionesHandymanPage {
  private toastCtrl = inject(ToastController);
  private operacionesService = inject(OperacionesHandymanService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  nombreTrabajador = signal<string>('Daniel');
  fotoPerfil = signal<string>('');

  trabajoExpandidoId = signal<string | null>(null);
  notaTemporal: Record<string, string> = {};

  listaTrabajos = this.operacionesService.listaTrabajos;

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
      trashOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      callOutline,
      navigateOutline,
      constructOutline,
      carOutline,
      saveOutline,
      sendOutline,
      chatbubbleEllipsesOutline,
      sparklesOutline,
      closeCircleOutline
    });
  }

  async ionViewWillEnter() {
    const usuario = await firstValueFrom(this.authService.currentUser$);
    if (usuario) {
      const perfil = await this.authService.obtenerPerfil(usuario.uid);
      if (perfil) {
        this.nombreTrabajador.set(perfil.nombre.split(' ')[0]);
        if (perfil.fotoUrl) this.fotoPerfil.set(perfil.fotoUrl);
      }
    }

    await this.operacionesService.cargarDatosHandyman();
    const lista = this.listaTrabajos();
    if (lista.length > 0 && !this.trabajoExpandidoId()) {
      this.trabajoExpandidoId.set(lista[0].id);
    }
  }

  filtroEstado = signal<string>('todos');
  filtroFecha = signal<string>('');

  totalNuevos = computed(() => {
    return this.listaTrabajos().filter(t => t.estado === 'NUEVO').length;
  });

  totalEnCamino = computed(() => {
    return this.listaTrabajos().filter(t => t.estado === 'En camino').length;
  });

  totalEnCurso = computed(() => {
    return this.listaTrabajos().filter(t => t.estado === 'En curso').length;
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

  private obtenerFechaFormateada(fechaStr: string): string {
    const optionsTime: Intl.DateTimeFormatOptions = { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' };
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
      const opcionesTexto: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      return fechaObj.toLocaleDateString('es-CO', opcionesTexto).toUpperCase();
    }
  }

  trabajosAgrupadosPorFecha = computed<GrupoTrabajosPorFecha[]>(() => {
    let trabajos = this.listaTrabajos();
    const estado = this.filtroEstado();
    const fechaFiltro = this.filtroFecha();

    if (estado !== 'todos') {
      trabajos = trabajos.filter(t => t.estado === estado);
    }

    if (fechaFiltro) {
      trabajos = trabajos.filter(t => t.fecha === fechaFiltro);
    }

    const mapaGrupos = new Map<string, TrabajoOperacion[]>();
    for (const t of trabajos) {
      if (!mapaGrupos.has(t.fecha)) {
        mapaGrupos.set(t.fecha, []);
      }
      mapaGrupos.get(t.fecha)!.push(t);
    }

    const grupos: GrupoTrabajosPorFecha[] = [];
    mapaGrupos.forEach((lista, fechaOriginal) => {
      grupos.push({
        fechaOriginal,
        fechaFormateada: this.obtenerFechaFormateada(fechaOriginal),
        trabajos: lista
      });
    });

    grupos.sort((a, b) => b.fechaOriginal.localeCompare(a.fechaOriginal));
    return grupos;
  });

  alternarExpansion(id: string) {
    if (this.trabajoExpandidoId() === id) {
      this.trabajoExpandidoId.set(null);
    } else {
      this.trabajoExpandidoId.set(id);
      if (this.notaTemporal[id] === undefined) {
        this.notaTemporal[id] = '';
      }
    }
  }

  obtenerBitacora(t: TrabajoOperacion): EntradaBitacora[] {
    if (t.bitacora && t.bitacora.length > 0) {
      return t.bitacora;
    }
    if (t.notas && t.notas.trim().length > 0) {
      return [{ id: 1, texto: t.notas, hora: t.horaCreacion, tipo: 'nota' }];
    }
    return [];
  }

  private obtenerHoraActual(): string {
    return new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  async cambiarEstadoTrabajo(trabajoId: string, nuevoEstado: EstadoTrabajo, event: Event) {
    event.stopPropagation();

    const textosResumen: Record<EstadoTrabajo, string> = {
      'NUEVO': 'Aceptado recientemente · Pendiente de salida',
      'En camino': 'En desplazamiento hacia el cliente',
      'En curso': 'En ejecución en el sitio',
      'Finalizado': 'Pagado · Servicio completado'
    };

    const hora = this.obtenerHoraActual();
    let trabajoActualizado: TrabajoOperacion | undefined;

    this.listaTrabajos.update(lista =>
      lista.map(t => {
        if (t.id === trabajoId) {
          const bitacoraActual = this.obtenerBitacora(t);
          const nuevoRegistroEstado: EntradaBitacora = {
            id: Date.now(),
            texto: `Estado actualizado a "${nuevoEstado}"`,
            hora,
            tipo: 'sistema'
          };
          trabajoActualizado = {
            ...t,
            estado: nuevoEstado,
            infoExtra: textosResumen[nuevoEstado],
            estrellas: nuevoEstado === 'Finalizado' ? (t.estrellas ?? 5) : undefined,
            bitacora: [...bitacoraActual, nuevoRegistroEstado]
          };
          return trabajoActualizado;
        }
        return t;
      })
    );

    this.cdr.detectChanges();
    if (trabajoActualizado) {
      await this.operacionesService.sincronizarTrabajoEnBd(trabajoActualizado);
    }
    await this.mostrarNotificacion(`Estado guardado en BD: "${nuevoEstado}"`);
  }

  async guardarNota(trabajoId: string, event?: Event) {
    if (event) event.stopPropagation();
    const texto = (this.notaTemporal[trabajoId] || '').trim();
    if (!texto) {
      await this.mostrarNotificacion('Escribe un avance o material antes de guardar');
      return;
    }

    const hora = this.obtenerHoraActual();
    const nuevaEntrada: EntradaBitacora = {
      id: Date.now(),
      texto,
      hora,
      tipo: 'nota'
    };

    let trabajoActualizado: TrabajoOperacion | undefined;

    this.listaTrabajos.update(lista =>
      lista.map(t => {
        if (t.id === trabajoId) {
          const bitacoraActual = this.obtenerBitacora(t);
          const actualizada = [...bitacoraActual, nuevaEntrada];
          trabajoActualizado = {
            ...t,
            notas: texto,
            bitacora: actualizada
          };
          return trabajoActualizado;
        }
        return t;
      })
    );

    this.notaTemporal[trabajoId] = '';
    this.cdr.detectChanges();
    if (trabajoActualizado) {
      await this.operacionesService.sincronizarTrabajoEnBd(trabajoActualizado);
    }
    await this.mostrarNotificacion('Registro guardado en la bitácora');
  }

  async eliminarEntradaBitacora(trabajoId: string, entradaId: number, event: Event) {
    event.stopPropagation();
    let trabajoActualizado: TrabajoOperacion | undefined;

    this.listaTrabajos.update(lista =>
      lista.map(t => {
        if (t.id === trabajoId) {
          const filtrada = this.obtenerBitacora(t).filter(b => b.id !== entradaId);
          const ultimaNota = [...filtrada].reverse().find(b => b.tipo !== 'sistema');
          trabajoActualizado = {
            ...t,
            bitacora: filtrada,
            notas: ultimaNota ? ultimaNota.texto : ''
          };
          return trabajoActualizado;
        }
        return t;
      })
    );
    this.cdr.detectChanges();
    if (trabajoActualizado) {
      await this.operacionesService.sincronizarTrabajoEnBd(trabajoActualizado);
    }
    await this.mostrarNotificacion('Registro eliminado');
  }

  async agregarFotoCapacitor(trabajoId: string, usarCamara: boolean, fileInputFallback: HTMLInputElement, event: Event) {
    event.stopPropagation();
    try {
      const imagen = await Camera.getPhoto({
        quality: 75,
        width: 900,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: usarCamara ? CameraSource.Camera : CameraSource.Photos
      });

      if (imagen?.dataUrl) {
        await this.insertarFotoEnTrabajo(trabajoId, imagen.dataUrl);
        await this.mostrarNotificacion('Evidencia fotográfica guardada en BD');
      }
    } catch (err) {
      if (fileInputFallback && !usarCamara) {
        fileInputFallback.click();
      }
    }
  }

  cargarFotoDesdeInputWeb(trabajoId: string, event: any) {
    const archivos: FileList | null = event?.target?.files;
    if (!archivos || archivos.length === 0) return;

    Array.from(archivos).forEach(archivo => {
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          await this.insertarFotoEnTrabajo(trabajoId, reader.result);
          this.cdr.detectChanges();
        }
      };
      reader.readAsDataURL(archivo);
    });

    this.mostrarNotificacion('Evidencia fotográfica sincronizada');
    event.target.value = '';
  }

  private async insertarFotoEnTrabajo(trabajoId: string, dataUrl: string) {
    const hora = this.obtenerHoraActual();
    let trabajoActualizado: TrabajoOperacion | undefined;

    this.listaTrabajos.update(lista =>
      lista.map(t => {
        if (t.id === trabajoId) {
          const nuevasFotos = [...t.fotos, dataUrl];
          const bitacoraActual = this.obtenerBitacora(t);
          trabajoActualizado = {
            ...t,
            fotos: nuevasFotos,
            bitacora: [
              ...bitacoraActual,
              {
                id: Date.now() + Math.floor(Math.random() * 1000),
                texto: `Evidencia fotográfica #${nuevasFotos.length} adjuntada`,
                hora,
                tipo: 'sistema'
              }
            ]
          };
          return trabajoActualizado;
        }
        return t;
      })
    );
    this.cdr.detectChanges();
    if (trabajoActualizado) {
      await this.operacionesService.sincronizarTrabajoEnBd(trabajoActualizado);
    }
  }

  async eliminarFoto(trabajoId: string, indiceFoto: number, event: Event) {
    event.stopPropagation();
    let trabajoActualizado: TrabajoOperacion | undefined;

    this.listaTrabajos.update(lista =>
      lista.map(t => {
        if (t.id === trabajoId) {
          trabajoActualizado = { ...t, fotos: t.fotos.filter((_, idx) => idx !== indiceFoto) };
          return trabajoActualizado;
        }
        return t;
      })
    );
    this.cdr.detectChanges();
    if (trabajoActualizado) {
      await this.operacionesService.sincronizarTrabajoEnBd(trabajoActualizado);
    }
    await this.mostrarNotificacion('Foto eliminada');
  }

  abrirMapa(direccion: string, event: Event) {
    event.stopPropagation();
    const query = encodeURIComponent(`${direccion}, Bogotá, Colombia`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  }

  llamarCliente(telefono: string, event: Event) {
    event.stopPropagation();
    window.open(`tel:${telefono}`, '_self');
  }

  cambiarFiltro(estado: string) {
    this.filtroEstado.set(estado);
  }

  filtrarPorFecha(event: any) {
    const valor = event?.target?.value || '';
    this.filtroFecha.set(valor);
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

  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'NUEVO': return 'badge-nuevo';
      case 'En camino': return 'badge-camino';
      case 'En curso': return 'badge-curso';
      case 'Finalizado': return 'badge-finalizado';
      default: return '';
    }
  }

  private async mostrarNotificacion(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 1800,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }
}