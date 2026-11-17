import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
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
  saveOutline
} from 'ionicons/icons';

export type EstadoTrabajo = 'En camino' | 'En curso' | 'Finalizado';

interface TrabajoOperacion {
  id: number;
  servicio: string;
  cliente: string;
  telefono: string;
  direccion: string;
  precio: string;
  estado: EstadoTrabajo;
  fecha: string;
  horaCreacion: string;
  infoExtra: string;
  estrellas?: number;
  notas: string;
  fotos: string[];
}

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
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class OperacionesHandymanPage {
  private toastCtrl = inject(ToastController);

  // Datos del trabajador
  nombreTrabajador = signal<string>('Daniel');
  fotoPerfil = signal<string>('');

  // Controla qué tarjeta está desplegada actualmente (null = ninguna)
  trabajoExpandidoId = signal<number | null>(1);

  // Borrador temporal de notas mientras edita
  notaTemporal: Record<number, string> = {};

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
      saveOutline
    });

    // Inicializar notas temporales con los datos actuales
    this.listaTrabajos().forEach(t => {
      this.notaTemporal[t.id] = t.notas;
    });
  }

  listaTrabajos = signal<TrabajoOperacion[]>([
    {
      id: 1,
      servicio: 'Instalación de lámparas',
      cliente: 'Camila Muñoz',
      telefono: '3104567890',
      direccion: 'Cra 15 #85-20',
      precio: '$60.000',
      estado: 'En camino',
      fecha: '2026-10-07',
      horaCreacion: '08:30 am',
      infoExtra: 'Llegada estimada en 10 min',
      notas: 'Llevar escalera plegable y chazos para techo en drywall.',
      fotos: []
    },
    {
      id: 2,
      servicio: 'Pintura sala principal',
      cliente: 'Marta T.',
      telefono: '3159876543',
      direccion: 'Calle 127 #45-10',
      precio: '$180.000',
      estado: 'En curso',
      fecha: '2026-10-07',
      horaCreacion: '09:15 am',
      infoExtra: 'En ejecución · 2da mano de pintura',
      notas: 'Se aplicó estuco plástico en fisuras de la pared norte. Pintura blanco hueso.',
      fotos: []
    },
    {
      id: 3,
      servicio: 'Reparación de cerradura',
      cliente: 'Andrés G.',
      telefono: '3001234567',
      direccion: 'Av. Chile #72-40',
      precio: '$95.000',
      estado: 'Finalizado',
      fecha: '2026-10-06',
      horaCreacion: '02:00 pm',
      infoExtra: 'Pagado · Calificado',
      estrellas: 5,
      notas: 'Cambio de cilindro de seguridad completado. Se entregaron 3 copias de llaves al cliente.',
      fotos: []
    },
    {
      id: 4,
      servicio: 'Mantenimiento de tuberías',
      cliente: 'Carlos Pérez',
      telefono: '3207654321',
      direccion: 'Calle 100 #15-30',
      precio: '$120.000',
      estado: 'Finalizado',
      fecha: '2026-09-28',
      horaCreacion: '10:45 am',
      infoExtra: 'Pagado · Calificado',
      estrellas: 4,
      notas: 'Se reemplazó sifón flexible y empaque de caucho sin fugas.',
      fotos: []
    }
  ]);

  filtroEstado = signal<string>('todos');
  filtroFecha = signal<string>('');

  // Contadores KPI en vivo
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

  // ==========================================
  // FUNCIONES INTERACTIVAS DE LA TARJETA
  // ==========================================

  alternarExpansion(id: number) {
    if (this.trabajoExpandidoId() === id) {
      this.trabajoExpandidoId.set(null);
    } else {
      this.trabajoExpandidoId.set(id);
      const trabajo = this.listaTrabajos().find(t => t.id === id);
      if (trabajo && this.notaTemporal[id] === undefined) {
        this.notaTemporal[id] = trabajo.notas;
      }
    }
  }

  async cambiarEstadoTrabajo(trabajoId: number, nuevoEstado: EstadoTrabajo, event: Event) {
    event.stopPropagation();

    const textosResumen: Record<EstadoTrabajo, string> = {
      'En camino': 'En desplazamiento hacia el cliente',
      'En curso': 'En ejecución en el sitio',
      'Finalizado': 'Pagado · Pendiente calificación'
    };

    this.listaTrabajos.update(lista =>
      lista.map(t => {
        if (t.id === trabajoId) {
          return {
            ...t,
            estado: nuevoEstado,
            infoExtra: textosResumen[nuevoEstado],
            estrellas: nuevoEstado === 'Finalizado' ? (t.estrellas ?? 5) : undefined
          };
        }
        return t;
      })
    );

    await this.mostrarNotificacion(`Estado actualizado a "${nuevoEstado}"`);
  }

  async guardarNota(trabajoId: number, event: Event) {
    event.stopPropagation();
    const texto = (this.notaTemporal[trabajoId] || '').trim();

    this.listaTrabajos.update(lista =>
      lista.map(t => t.id === trabajoId ? { ...t, notas: texto } : t)
    );

    await this.mostrarNotificacion('Nota técnica guardada correctamente');
  }

  async agregarFotoCapacitor(trabajoId: number, usarCamara: boolean, event: Event) {
    event.stopPropagation();
    try {
      const imagen = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: usarCamara ? CameraSource.Camera : CameraSource.Photos
      });

      if (imagen?.dataUrl) {
        this.insertarFotoEnTrabajo(trabajoId, imagen.dataUrl);
        await this.mostrarNotificacion('Evidencia fotográfica añadida');
      }
    } catch (err) {
      // Si el usuario cancela o está en navegador sin permisos de cámara nativa, no rompe el flujo
      console.log('Captura cancelada o usando selector web:', err);
    }
  }

  cargarFotoDesdeInputWeb(trabajoId: number, event: any) {
    const archivo = event?.target?.files?.[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        this.insertarFotoEnTrabajo(trabajoId, reader.result);
        await this.mostrarNotificacion('Foto cargada en la orden');
      }
    };
    reader.readAsDataURL(archivo);
    event.target.value = '';
  }

  private insertarFotoEnTrabajo(trabajoId: number, dataUrl: string) {
    this.listaTrabajos.update(lista =>
      lista.map(t => {
        if (t.id === trabajoId) {
          return { ...t, fotos: [...t.fotos, dataUrl] };
        }
        return t;
      })
    );
  }

  async eliminarFoto(trabajoId: number, indiceFoto: number, event: Event) {
    event.stopPropagation();
    this.listaTrabajos.update(lista =>
      lista.map(t => {
        if (t.id === trabajoId) {
          return { ...t, fotos: t.fotos.filter((_, idx) => idx !== indiceFoto) };
        }
        return t;
      })
    );
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

  // ==========================================
  // FILTROS GENERALES
  // ==========================================

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
      case 'En camino': return 'badge-camino';
      case 'En curso': return 'badge-curso';
      case 'Finalizado': return 'badge-finalizado';
      default: return '';
    }
  }

  private async mostrarNotificacion(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }
}