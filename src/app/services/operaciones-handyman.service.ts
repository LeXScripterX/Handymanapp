import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export type EstadoTrabajo = 'NUEVO' | 'En camino' | 'En curso' | 'Finalizado';

export interface EntradaBitacora {
  id: number;
  texto: string;
  hora: string;
  tipo?: 'nota' | 'sistema';
}

export interface TrabajoOperacion {
  id: string;
  servicioId?: string;
  servicio: string;
  cliente: string;
  telefono: string;
  direccion: string;
  precio: string;
  precioNumerico?: number;
  estado: EstadoTrabajo;
  fecha: string;
  horaCreacion: string;
  infoExtra: string;
  estrellas?: number;
  notas: string;
  bitacora?: EntradaBitacora[];
  fotos: string[];
}

export interface SolicitudPendienteHome {
  id: string;
  cliente: string;
  telefono?: string;
  servicio: string;
  categoriaZona: string;
  direccion: string;
  mensaje: string;
  precio: string;
  precioNumerico: number;
  distancia: string;
  hace: string;
}

export interface ServicioMarketplace {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  categoria: string;
  handymanId: string;
  handymanNombre?: string;
  handymanTelefono?: string;
  handymanCalificacion?: number;
  handymanFoto?: string;
  zona?: string;
  activo?: boolean;
}

export interface SolicitudClienteApi {
  id: string;
  servicioId: string;
  servicioTitulo?: string;
  servicioCategoria?: string;
  clienteId: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  handymanId: string;
  handymanNombre?: string;
  handymanTelefono?: string;
  mensaje: string;
  direccion?: string;
  ubicacionDetalle?: string;
  precio?: number;
  estado: 'pendiente' | 'aceptada' | 'en_camino' | 'en_curso' | 'completada' | 'rechazada';
  creado?: string;
  notas?: string;
  bitacora?: EntradaBitacora[];
  fotos?: string[];
  estrellas?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OperacionesHandymanService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Signals reactivos alimentados desde FastAPI + Firestore
  solicitudesPendientes = signal<SolicitudPendienteHome[]>([]);
  listaTrabajos = signal<TrabajoOperacion[]>([]);
  serviciosMarketplace = signal<ServicioMarketplace[]>([]);
  solicitudesCliente = signal<SolicitudClienteApi[]>([]);
  cargando = signal<boolean>(false);

  private async obtenerHeaders(): Promise<HttpHeaders> {
    const token = await this.authService.getIdToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private formatearMoneda(valor?: number): string {
    const num = Number(valor || 0);
    return '$' + num.toLocaleString('es-CO');
  }

  private extraerFechaYHora(isoStr?: string): { fecha: string; hora: string; hace: string } {
    const optionsTime: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    const ahora = new Date();
    const fechaObj = isoStr ? new Date(isoStr) : ahora;
    const fechaValida = isNaN(fechaObj.getTime()) ? ahora : fechaObj;

    const fecha = new Intl.DateTimeFormat('en-CA', optionsTime).format(fechaValida);
    const hora = fechaValida.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const diffMin = Math.max(1, Math.floor((ahora.getTime() - fechaValida.getTime()) / 60000));
    let hace = `hace ${diffMin} min`;
    if (diffMin >= 60 && diffMin < 1440) {
      hace = `hace ${Math.floor(diffMin / 60)} h`;
    } else if (diffMin >= 1440) {
      hace = `hace ${Math.floor(diffMin / 1440)} d`;
    }

    return { fecha, hora, hace };
  }

  private mapearEstadoApiAUi(estadoApi: string): EstadoTrabajo {
    switch (estadoApi) {
      case 'aceptada':
        return 'NUEVO';
      case 'en_camino':
        return 'En camino';
      case 'en_curso':
        return 'En curso';
      case 'completada':
        return 'Finalizado';
      default:
        return 'NUEVO';
    }
  }

  public mapearEstadoUiAApi(estadoUi: EstadoTrabajo): string {
    switch (estadoUi) {
      case 'NUEVO':
        return 'aceptada';
      case 'En camino':
        return 'en_camino';
      case 'En curso':
        return 'en_curso';
      case 'Finalizado':
        return 'completada';
    }
  }

  // ── CARGAR SOLICITUDES REALES DEL HANDYMAN DESDE FASTAPI ──────────────────
  async cargarDatosHandyman(): Promise<void> {
    this.cargando.set(true);
    try {
      const headers = await this.obtenerHeaders();
      const respuesta = await firstValueFrom(
        this.http.get<SolicitudClienteApi[]>(`${environment.apiUrl}/solicitudes/`, { headers })
      );

      const pendientes: SolicitudPendienteHome[] = [];
      const operativos: TrabajoOperacion[] = [];

      for (const sol of respuesta) {
        const { fecha, hora, hace } = this.extraerFechaYHora(sol.creado);
        const precioFormateado = this.formatearMoneda(sol.precio);
        const zona = sol.ubicacionDetalle || 'Bogotá';
        const cat = sol.servicioCategoria
          ? sol.servicioCategoria.charAt(0).toUpperCase() + sol.servicioCategoria.slice(1)
          : 'Servicio';

        if (sol.estado === 'pendiente') {
          pendientes.push({
            id: sol.id,
            cliente: sol.clienteNombre || 'Cliente',
            telefono: sol.clienteTelefono || '3000000000',
            servicio: sol.servicioTitulo || sol.mensaje,
            categoriaZona: `${cat} · ${zona}`,
            direccion: sol.direccion || zona,
            mensaje: sol.mensaje,
            precio: precioFormateado,
            precioNumerico: sol.precio || 0,
            distancia: zona,
            hace
          });
        } else if (sol.estado !== 'rechazada') {
          const estadoUi = this.mapearEstadoApiAUi(sol.estado);
          const textosResumen: Record<EstadoTrabajo, string> = {
            'NUEVO': `Aceptado · ${sol.mensaje}`,
            'En camino': 'En desplazamiento hacia el cliente',
            'En curso': 'En ejecución en el sitio',
            'Finalizado': 'Pagado · Servicio completado'
          };

          operativos.push({
            id: sol.id,
            servicioId: sol.servicioId,
            servicio: sol.servicioTitulo || 'Servicio solicitado',
            cliente: sol.clienteNombre || 'Cliente',
            telefono: sol.clienteTelefono || '3000000000',
            direccion: `${sol.direccion || 'Bogotá'}${sol.ubicacionDetalle ? ' (' + sol.ubicacionDetalle + ')' : ''}`,
            precio: precioFormateado,
            precioNumerico: sol.precio || 0,
            estado: estadoUi,
            fecha,
            horaCreacion: hora,
            infoExtra: textosResumen[estadoUi],
            estrellas: sol.estrellas ?? (estadoUi === 'Finalizado' ? 5 : undefined),
            notas: sol.notas || '',
            bitacora: sol.bitacora && sol.bitacora.length > 0
              ? sol.bitacora
              : [
                  {
                    id: 1,
                    texto: `Requerimiento del cliente: ${sol.mensaje}`,
                    hora,
                    tipo: 'sistema'
                  }
                ],
            fotos: sol.fotos || []
          });
        }
      }

      this.solicitudesPendientes.set(pendientes);
      this.listaTrabajos.set(operativos);
    } catch (error) {
      console.error('Error cargando solicitudes de la API:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  // ── ACEPTAR SOLICITUD (PASA DE 'pendiente' A 'aceptada' EN FIRESTORE) ─────
  async aceptarSolicitud(solicitud: SolicitudPendienteHome): Promise<void> {
    const headers = await this.obtenerHeaders();
    const horaActual = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const bitacoraInicial: EntradaBitacora[] = [
      {
        id: Date.now(),
        texto: `Orden aceptada por Daniel. Detalle del cliente: "${solicitud.mensaje}"`,
        hora: horaActual,
        tipo: 'sistema'
      }
    ];

    await firstValueFrom(
      this.http.patch(
        `${environment.apiUrl}/solicitudes/${solicitud.id}/estado`,
        {
          estado: 'aceptada',
          bitacora: bitacoraInicial
        },
        { headers }
      )
    );

    await this.cargarDatosHandyman();
  }

  // ── RECHAZAR SOLICITUD EN FIRESTORE ───────────────────────────────────────
  async rechazarSolicitud(solicitudId: string): Promise<void> {
    const headers = await this.obtenerHeaders();
    await firstValueFrom(
      this.http.patch(
        `${environment.apiUrl}/solicitudes/${solicitudId}/estado`,
        { estado: 'rechazada' },
        { headers }
      )
    );
    this.solicitudesPendientes.update(lista => lista.filter(s => s.id !== solicitudId));
  }

  // ── GUARDAR CAMBIOS DE ESTADO, BITÁCORA Y FOTOS EN FIRESTORE ──────────────
  async sincronizarTrabajoEnBd(trabajo: TrabajoOperacion): Promise<void> {
    try {
      const headers = await this.obtenerHeaders();
      const estadoApi = this.mapearEstadoUiAApi(trabajo.estado);
      await firstValueFrom(
        this.http.patch(
          `${environment.apiUrl}/solicitudes/${trabajo.id}/estado`,
          {
            estado: estadoApi,
            notas: trabajo.notas,
            bitacora: trabajo.bitacora || [],
            fotos: trabajo.fotos || [],
            estrellas: trabajo.estrellas
          },
          { headers }
        )
      );
    } catch (error) {
      console.error('Error sincronizando cambios del trabajo en BD:', error);
    }
  }

  // ── MÉTODOS PARA EL CLIENTE (CATÁLOGO Y SOLICITUDES EN VIVO) ──────────────
  async cargarCatalogoServicios(categoria?: string): Promise<ServicioMarketplace[]> {
    const headers = await this.obtenerHeaders();
    const url = categoria
      ? `${environment.apiUrl}/servicios/?categoria=${encodeURIComponent(categoria)}`
      : `${environment.apiUrl}/servicios/`;
    const lista = await firstValueFrom(this.http.get<ServicioMarketplace[]>(url, { headers }));
    this.serviciosMarketplace.set(lista);
    return lista;
  }

  async crearSolicitudCliente(payload: {
    servicioId: string;
    mensaje: string;
    direccion: string;
    ubicacionDetalle: string;
    precio?: number;
    clienteTelefono?: string;
  }): Promise<{ id: string }> {
    const headers = await this.obtenerHeaders();
    const res = await firstValueFrom(
      this.http.post<{ id: string }>(`${environment.apiUrl}/solicitudes/`, payload, { headers })
    );
    await this.cargarSolicitudesCliente();
    return res;
  }

  async cargarSolicitudesCliente(): Promise<SolicitudClienteApi[]> {
    const headers = await this.obtenerHeaders();
    const lista = await firstValueFrom(
      this.http.get<SolicitudClienteApi[]>(`${environment.apiUrl}/solicitudes/`, { headers })
    );
    this.solicitudesCliente.set(lista);
    return lista;
  }

  async confirmarFinalizacionCliente(solicitudId: string, estrellas: number): Promise<void> {
    const headers = await this.obtenerHeaders();
    await firstValueFrom(
      this.http.patch(
        `${environment.apiUrl}/solicitudes/${solicitudId}/estado`,
        { estado: 'completada', estrellas },
        { headers }
      )
    );
    await this.cargarSolicitudesCliente();
  }
}