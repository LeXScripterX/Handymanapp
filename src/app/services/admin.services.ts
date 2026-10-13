import { Injectable, signal } from '@angular/core';
import { Resena, Servicio, Usuario } from '../pages/admin/admin-models'

@Injectable({ providedIn: 'root' })
export class AdminService {
  // TODO: reemplazar estos datos de ejemplo por llamadas a tu backend
  usuarios = signal<Usuario[]>([
    { id: '1', nombre: 'Carlos Ruiz', email: 'carlos@mail.com', rol: 'trabajador', verificado: true, activo: true },
    { id: '2', nombre: 'Ana Gómez', email: 'ana@mail.com', rol: 'cliente', verificado: false, activo: true },
    { id: '3', nombre: 'Luis Peña', email: 'luis@mail.com', rol: 'trabajador', verificado: false, activo: true },
  ]);

  servicios = signal<Servicio[]>([
    { id: '1', nombre: 'Electricista', activo: true },
    { id: '2', nombre: 'Plomero', activo: true },
    { id: '3', nombre: 'Cerrajero', activo: true },
    { id: '4', nombre: 'Carpintero', activo: true },
    { id: '5', nombre: 'Ornamentador', activo: true },
  ]);

  resenas = signal<Resena[]>([
    { id: '1', autor: 'Ana Gómez', trabajador: 'Carlos Ruiz', estrellas: 5, comentario: 'Excelente trabajo, muy puntual.', estado: 'pendiente' },
    { id: '2', autor: 'Pedro Díaz', trabajador: 'Luis Peña', estrellas: 2, comentario: 'Llegó tarde.', estado: 'pendiente' },
  ]);

  alternarVerificado(id: string) {
    this.usuarios.update(l => l.map(u => u.id === id ? { ...u, verificado: !u.verificado } : u));
  }

  alternarActivo(id: string) {
    this.usuarios.update(l => l.map(u => u.id === id ? { ...u, activo: !u.activo } : u));
  }

  agregarServicio(nombre: string) {
    this.servicios.update(l => [...l, { id: crypto.randomUUID(), nombre, activo: true }]);
  }

  alternarServicio(id: string) {
    this.servicios.update(l => l.map(s => s.id === id ? { ...s, activo: !s.activo } : s));
  }

  eliminarServicio(id: string) {
    this.servicios.update(l => l.filter(s => s.id !== id));
  }

  moderarResena(id: string, estado: 'aprobada' | 'rechazada') {
    this.resenas.update(l => l.map(r => r.id === id ? { ...r, estado } : r));
  }
}