import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  star, 
  timeOutline, 
  personOutline, 
  notificationsOutline, 
  homeOutline, 
  clipboardOutline, 
  radioButtonOnOutline,
  fileTrayOutline
} from 'ionicons/icons';

// 1. IMPORTAMOS NUESTRO COMPONENTE DE HEADER REUTILIZABLE
import { HeaderHandymanComponent } from '../header-handyman/header-handyman.component';

interface TrabajoOperacion {
  id: number;
  servicio: string;
  cliente: string;
  direccion: string;
  precio: string;
  estado: 'En camino' | 'En curso' | 'Finalizado';
  fecha: string;
  horaCreacion: string;
  infoExtra: string;
  estrellas?: number;
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
  imports: [
    CommonModule, 
    IonicModule, 
    RouterModule,
    HeaderHandymanComponent // 2. LO AGREGAMOS A LOS IMPORTS
  ]
})
export class OperacionesHandymanPage {
  
  // Nombre y foto del trabajador
  nombreTrabajador = signal<string>('Daniel');
  fotoPerfil = signal<string>(''); // Si está vacío se genera el avatar con la inicial 'D'

  constructor() {
    // Registro obligatorio de iconos en Ionic Standalone
    addIcons({
      star,
      timeOutline,
      personOutline,
      notificationsOutline,
      homeOutline,
      clipboardOutline,
      radioButtonOnOutline,
      fileTrayOutline
    });
  }

  listaTrabajos = signal<TrabajoOperacion[]>([
    {
      id: 1,
      servicio: 'Instalación de lámparas',
      cliente: 'Camila Muñoz · Cra 15 #85-20',
      direccion: 'Cra 15 #85-20',
      precio: '$60.000',
      estado: 'En camino',
      fecha: '2026-10-07',
      horaCreacion: '08:30 am',
      infoExtra: 'Llegada estimada en 10 min'
    },
    {
      id: 2,
      servicio: 'Pintura sala principal',
      cliente: 'Marta T. (cliente) · Calle 127 #45-10',
      direccion: 'Calle 127 #45-10',
      precio: '$180.000',
      estado: 'En curso',
      fecha: '2026-10-07',
      horaCreacion: '09:15 am',
      infoExtra: 'En ejecución'
    },
    {
      id: 3,
      servicio: 'Reparación de cerradura',
      cliente: 'Andrés G. · Av. Chile #72-40',
      direccion: 'Av. Chile #72-40',
      precio: '$95.000',
      estado: 'Finalizado',
      fecha: '2026-10-06',
      horaCreacion: '02:00 pm',
      infoExtra: 'Pagado · Calificado',
      estrellas: 5
    },
    {
      id: 4,
      servicio: 'Mantenimiento de tuberías',
      cliente: 'Carlos Pérez · Calle 100 #15-30',
      direccion: 'Calle 100 #15-30',
      precio: '$120.000',
      estado: 'Finalizado',
      fecha: '2026-09-28',
      horaCreacion: '10:45 am',
      infoExtra: 'Pagado · Calificado',
      estrellas: 4
    }
  ]);

  filtroEstado = signal<string>('todos');
  filtroFecha = signal<string>('');

  // Contadores computados
  totalEnCamino = computed(() => {
    return this.listaTrabajos().filter(t => t.estado === 'En camino').length;
  });

  totalEnCurso = computed(() => {
    return this.listaTrabajos().filter(t => t.estado === 'En curso').length;
  });

  // Fecha en formato dd/mm/aaaa para el botón
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

  cambiarFiltro(estado: string) {
    this.filtroEstado.set(estado);
  }

  filtrarPorFecha(event: any) {
    const valor = event?.target?.value || '';
    this.filtroFecha.set(valor);
  }

  // Abre el selector de fecha con compatibilidad total en PC y móviles
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
}