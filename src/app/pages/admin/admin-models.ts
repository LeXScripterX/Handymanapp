export type Rol = 'cliente' | 'trabajador';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  verificado: boolean;
  activo: boolean;
}

export interface Servicio {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Resena {
  id: string;
  autor: string;
  trabajador: string;
  estrellas: number;
  comentario: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}