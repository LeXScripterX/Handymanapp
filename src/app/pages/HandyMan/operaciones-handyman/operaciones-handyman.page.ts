import { Component, signal, computed, inject } from '@angular/core';
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

import { HeaderHandymanComponent } from '../header-handyman/header-handyman.component';
// AGREGADO: Importamos el servicio
import { OperacionesHandymanService, TrabajoOperacion } from '../../../services/operaciones-handyman.service';

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
    HeaderHandymanComponent
  ]
})
export class OperacionesHandymanPage {
  // AGREGADO: Inyección del servicio
  private operacionesService = inject(OperacionesHandymanService);

  nombreTrabajador = signal<string>('Daniel');
  fotoPerfil = signal<string>(''); 

  // MODIFICADO: Ahora lee los trabajos del servicio compartido
  listaTrabajos = this.operacionesService.listaTrabajos;

  filtroEstado = signal<string>('todos');
  filtroFecha = signal<string>('');

  // AGREGADO: Contador para el nuevo estado
  totalNuevos = computed(() => {
    return this.listaTrabajos().filter((t: TrabajoOperacion) => t.estado === 'NUEVO').length;
  });

  totalEnCamino = computed(() => {
    return this.listaTrabajos().filter((t: TrabajoOperacion) => t.estado === 'En camino').length;
  });

  totalEnCurso = computed(() => {
    return this.listaTrabajos().filter((t: TrabajoOperacion) => t.estado === 'En curso').length;
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

  constructor() {
    addIcons({
      star, timeOutline, personOutline, notificationsOutline, 
      homeOutline, clipboardOutline, radioButtonOnOutline, fileTrayOutline
    });
  }

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
      trabajos = trabajos.filter((t: TrabajoOperacion) => t.estado === estado);
    }

    if (fechaFiltro) {
      trabajos = trabajos.filter((t: TrabajoOperacion) => t.fecha === fechaFiltro);
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
      case 'NUEVO': return 'badge-nuevo'; // AGREGADO
      case 'En camino': return 'badge-camino';
      case 'En curso': return 'badge-curso';
      case 'Finalizado': return 'badge-finalizado';
      default: return '';
    }
  }
}