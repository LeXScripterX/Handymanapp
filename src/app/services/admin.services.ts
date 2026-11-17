import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Resena, Servicio, Usuario } from '../pages/admin/admin-models';

export interface CategoriaStats {
  categoria: string;
  servicios: number;
  trabajadores: number;
  verificados: number;
  sin_verificar: number;
  activos: number;
}

export interface Estadisticas {
  resumen: {
    total_usuarios: number;
    trabajadores: number;
    clientes: number;
    registrados_ultimos_7_dias: number;
    activos: number;
    inactivos: number;
    trabajadores_verificados: number;
    trabajadores_sin_verificar: number;
  };
  por_categoria: CategoriaStats[];
}

interface UsuarioApi {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  verificado: boolean;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/admin`;

  // ---------- Estadísticas ----------
  estadisticas = signal<Estadisticas | null>(null);
  errorEstadisticas = signal('');

  cargarEstadisticas() {
    this.errorEstadisticas.set('');
    this.http.get<Estadisticas>(`${this.api}/estadisticas`).subscribe({
      next: s => this.estadisticas.set(s),
      error: e => {
        console.error('Error estadísticas:', e);
        this.errorEstadisticas.set(
          e.status === 0 ? 'Sin conexión con el servidor' :
          e.status === 401 ? 'Sesión no válida, vuelve a iniciar sesión' :
          e.status === 403 ? 'Tu usuario no es administrador' :
          e.status === 404 ? 'La ruta de estadísticas no existe en el backend' :
          'No se pudieron cargar las estadísticas'
        );
      },
    });
  }

  // ---------- Usuarios (reales) ----------
  usuarios = signal<Usuario[]>([]);
  cargandoUsuarios = signal(false);
  errorUsuarios = signal('');

  cargarUsuarios() {
    this.cargandoUsuarios.set(true);
    this.errorUsuarios.set('');
    this.http.get<UsuarioApi[]>(`${this.api}/usuarios`).subscribe({
      next: lista => {
        this.usuarios.set(
          lista
            .filter(u => u.rol !== 'admin')
            .map(u => ({ ...u, rol: u.rol === 'handyman' ? 'trabajador' : u.rol }) as Usuario)
        );
        this.cargandoUsuarios.set(false);
      },
      error: e => {
        console.error('Error usuarios:', e);
        this.errorUsuarios.set('No se pudieron cargar los usuarios');
        this.cargandoUsuarios.set(false);
      },
    });
  }

  private parcharUsuario(id: string, cambios: Partial<Usuario>) {
    this.usuarios.update(l => l.map(u => (u.id === id ? { ...u, ...cambios } : u)));
  }

  alternarVerificado(id: string) {
    const u = this.usuarios().find(x => x.id === id);
    if (!u) return;
    const nuevo = !u.verificado;
    this.parcharUsuario(id, { verificado: nuevo });
    this.http.patch(`${this.api}/usuarios/${id}/verificado`, { valor: nuevo }).subscribe({
      next: () => this.cargarEstadisticas(),
      error: () => this.parcharUsuario(id, { verificado: !nuevo }),
    });
  }

  alternarActivo(id: string) {
    const u = this.usuarios().find(x => x.id === id);
    if (!u) return;
    const nuevo = !u.activo;
    this.parcharUsuario(id, { activo: nuevo });
    this.http.patch(`${this.api}/usuarios/${id}/activo`, { valor: nuevo }).subscribe({
      next: () => this.cargarEstadisticas(),
      error: () => this.parcharUsuario(id, { activo: !nuevo }),
    });
  }

  // ---------- Servicios (siguen de ejemplo) ----------
  servicios = signal<Servicio[]>([
    { id: '1', nombre: 'Electricista', activo: true },
    { id: '2', nombre: 'Plomero', activo: true },
    { id: '3', nombre: 'Cerrajero', activo: true },
    { id: '4', nombre: 'Carpintero', activo: true },
    { id: '5', nombre: 'Ornamentador', activo: true },
  ]);

  agregarServicio(nombre: string) {
    this.servicios.update(l => [...l, { id: crypto.randomUUID(), nombre, activo: true }]);
  }

  alternarServicio(id: string) {
    this.servicios.update(l => l.map(s => (s.id === id ? { ...s, activo: !s.activo } : s)));
  }

  eliminarServicio(id: string) {
    this.servicios.update(l => l.filter(s => s.id !== id));
  }

  // ---------- Reseñas (siguen de ejemplo) ----------
  resenas = signal<Resena[]>([
    { id: '1', autor: 'Ana Gómez', trabajador: 'Carlos Ruiz', estrellas: 5, comentario: 'Excelente trabajo, muy puntual.', estado: 'pendiente' },
    { id: '2', autor: 'Pedro Díaz', trabajador: 'Luis Peña', estrellas: 2, comentario: 'Llegó tarde.', estado: 'pendiente' },
  ]);

  moderarResena(id: string, estado: 'aprobada' | 'rechazada') {
    this.resenas.update(l => l.map(r => (r.id === id ? { ...r, estado } : r)));
  }
}