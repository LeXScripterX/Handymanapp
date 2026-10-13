import { Injectable, signal } from '@angular/core';

export interface TrabajoOperacion {
  id: number;
  servicio: string;
  cliente: string;
  direccion: string;
  precio: string;
  estado: 'NUEVO' | 'En camino' | 'En curso' | 'Finalizado';
  fecha: string;
  horaCreacion: string;
  infoExtra: string;
  estrellas?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OperacionesHandymanService {
  // Estado global de los trabajos iniciales
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

  aceptarSolicitud(solicitud: any) {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const fechaFormat = `${yyyy}-${mm}-${dd}`;
    
    let horas = hoy.getHours();
    const ampm = horas >= 12 ? 'pm' : 'am';
    horas = horas % 12;
    horas = horas ? horas : 12; 
    const minutos = String(hoy.getMinutes()).padStart(2, '0');
    const horaFormat = `${String(horas).padStart(2, '0')}:${minutos} ${ampm}`;

    const nuevoTrabajo: TrabajoOperacion = {
      id: Date.now(),
      servicio: solicitud.servicio,
      cliente: `${solicitud.cliente} · ${solicitud.categoriaZona.split(' · ')[1] || 'Sin dirección'}`,
      direccion: solicitud.categoriaZona, 
      precio: solicitud.precio,
      estado: 'NUEVO',
      fecha: fechaFormat,
      horaCreacion: horaFormat,
      infoExtra: 'Pendiente de iniciar'
    };
    
    // Inyecta el nuevo trabajo en la señal global
    this.listaTrabajos.update(lista => [nuevoTrabajo, ...lista]);
  }
}