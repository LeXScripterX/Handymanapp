import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertController,
  IonContent,
  IonIcon,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  banOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  closeOutline,
  constructOutline,
  createOutline,
  hammerOutline,
  logOutOutline,
  mailOutline,
  peopleOutline,
  personOutline,
  searchOutline,
  shieldCheckmarkOutline,
  statsChartOutline,
  timeOutline,
} from 'ionicons/icons';
import { catchError, of } from 'rxjs';
import { AdminService, UsuarioAdmin } from '../../services/admin.service';
import { AuthService, UserRole } from '../../services/auth.service';

type Seccion = 'resumen' | 'usuarios' | 'aprobaciones' | 'servicios';
type FiltroRol = 'todos' | UserRole;

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, ReactiveFormsModule],
})
export class AdminPage {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  // ───────── Estado de la interfaz ─────────
  seccion = signal<Seccion>('resumen');
  busqueda = signal('');
  filtroRol = signal<FiltroRol>('todos');
  editando = signal<UsuarioAdmin | null>(null);
  guardando = signal(false);
  errorCarga = signal('');

  readonly secciones: { id: Seccion; etiqueta: string; icono: string }[] = [
    { id: 'resumen', etiqueta: 'Resumen', icono: 'stats-chart-outline' },
    { id: 'usuarios', etiqueta: 'Usuarios', icono: 'people-outline' },
    { id: 'aprobaciones', etiqueta: 'Aprobaciones', icono: 'shield-checkmark-outline' },
    { id: 'servicios', etiqueta: 'Servicios', icono: 'hammer-outline' },
  ];

  readonly filtros: { id: FiltroRol; etiqueta: string }[] = [
    { id: 'todos', etiqueta: 'Todos' },
    { id: 'cliente', etiqueta: 'Clientes' },
    { id: 'handyman', etiqueta: 'Handymans' },
    { id: 'admin', etiqueta: 'Admins' },
  ];

  readonly roles: { id: UserRole; etiqueta: string; icono: string }[] = [
    { id: 'cliente', etiqueta: 'Cliente', icono: 'person-outline' },
    { id: 'handyman', etiqueta: 'Handyman', icono: 'construct-outline' },
    { id: 'admin', etiqueta: 'Admin', icono: 'shield-checkmark-outline' },
  ];

  // ───────── Datos ─────────
  /** undefined = cargando, null = sin sesión, objeto = perfil con rol */
  perfil = toSignal(this.authService.currentUserProfile$);
  esAdmin = computed(() => this.perfil()?.rol === 'admin');
  nombreAdmin = computed(() => this.perfil()?.nombre?.split(' ')[0] ?? 'admin');

  private usuariosRaw = toSignal(
    this.adminService.usuarios$.pipe(
      catchError(() => {
        this.errorCarga.set('No se pudieron cargar los usuarios. Revisa las reglas de Firestore.');
        return of([] as UsuarioAdmin[]);
      })
    )
  );
  private serviciosRaw = toSignal(
    this.adminService.servicios$.pipe(catchError(() => of([])))
  );

  cargando = computed(() => this.usuariosRaw() === undefined);
  usuarios = computed(() => this.usuariosRaw() ?? []);
  servicios = computed(() => this.serviciosRaw() ?? []);

  // ───────── Derivados ─────────
  usuariosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const rol = this.filtroRol();
    return this.usuarios()
      .filter((u) => rol === 'todos' || u.rol === rol)
      .filter(
        (u) =>
          !texto ||
          u.nombre?.toLowerCase().includes(texto) ||
          u.email?.toLowerCase().includes(texto)
      )
      .sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? ''));
  });

  pendientes = computed(() =>
    this.usuarios().filter((u) => u.rol === 'handyman' && this.estadoAprob(u) === 'pendiente')
  );

  estadisticas = computed(() => {
    const us = this.usuarios();
    return {
      total: us.length,
      clientes: us.filter((u) => u.rol === 'cliente').length,
      handymans: us.filter((u) => u.rol === 'handyman').length,
      pendientes: this.pendientes().length,
      deshabilitados: us.filter((u) => !this.esHabilitado(u)).length,
      servicios: this.servicios().length,
    };
  });

  serviciosPorEstado = computed(() => {
    const total = this.servicios().length || 1;
    const conteo = new Map<string, number>();
    for (const s of this.servicios()) {
      const clave = s.estado ?? 'sin estado';
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    }
    return [...conteo.entries()].map(([estado, cantidad]) => ({
      estado,
      cantidad,
      porcentaje: Math.round((cantidad / total) * 100),
    }));
  });

  // ───────── Formulario de edición ─────────
  formEdicion = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    rol: ['cliente' as UserRole, Validators.required],
  });

  constructor() {
    addIcons({
      banOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      closeOutline,
      constructOutline,
      createOutline,
      hammerOutline,
      logOutOutline,
      mailOutline,
      peopleOutline,
      personOutline,
      searchOutline,
      shieldCheckmarkOutline,
      statsChartOutline,
      timeOutline,
    });

    // Solo el rol admin puede ver esta pantalla (la seguridad real va en las reglas de Firestore).
    effect(() => {
      const p = this.perfil();
      if (p === undefined) return; // aún cargando
      if (!p || p.rol !== 'admin') this.router.navigateByUrl('/login');
    });
  }

  // ───────── Helpers de presentación ─────────
  esHabilitado(u: UsuarioAdmin): boolean {
    return u.habilitado !== false;
  }

  estadoAprob(u: UsuarioAdmin) {
    return u.rol === 'handyman' ? (u.estadoAprobacion ?? 'pendiente') : null;
  }

  esUnoMismo(u: UsuarioAdmin): boolean {
    return u.uid === this.perfil()?.uid;
  }

  inicial(u: UsuarioAdmin): string {
    return (u.nombre || u.email || '?').charAt(0).toUpperCase();
  }

  formatearFecha(f: any): string {
    const fecha = f?.toDate ? f.toDate() : f ? new Date(f) : null;
    return fecha && !isNaN(fecha.getTime()) ? fecha.toLocaleDateString('es-CO') : '';
  }

  // ───────── Navegación / búsqueda ─────────
  cambiarSeccion(s: Seccion) {
    this.seccion.set(s);
  }

  alBuscar(evento: Event) {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  // ───────── Acciones sobre usuarios ─────────
  abrirEdicion(u: UsuarioAdmin) {
    this.formEdicion.reset({ nombre: u.nombre, rol: u.rol });
    this.editando.set(u);
  }

  cerrarEdicion() {
    this.editando.set(null);
  }

  elegirRol(rol: UserRole) {
    this.formEdicion.patchValue({ rol });
  }

  async guardarEdicion() {
    const usuario = this.editando();
    if (!usuario || this.formEdicion.invalid) {
      this.formEdicion.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    try {
      const { nombre, rol } = this.formEdicion.getRawValue();
      await this.adminService.actualizarUsuario(usuario.uid, { nombre: nombre.trim(), rol });
      this.cerrarEdicion();
      await this.avisar('Cambios guardados');
    } catch {
      await this.avisar('No se pudieron guardar los cambios', true);
    } finally {
      this.guardando.set(false);
    }
  }

  async alternarHabilitado(u: UsuarioAdmin) {
    const deshabilitar = this.esHabilitado(u);
    const alerta = await this.alertCtrl.create({
      header: deshabilitar ? 'Deshabilitar usuario' : 'Habilitar usuario',
      message: deshabilitar
        ? `${u.nombre} ya no podrá usar la aplicación.`
        : `${u.nombre} podrá volver a usar la aplicación.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: deshabilitar ? 'Deshabilitar' : 'Habilitar',
          role: 'confirm',
          handler: () => this.aplicar(u, { habilitado: !deshabilitar },
            deshabilitar ? 'Usuario deshabilitado' : 'Usuario habilitado'),
        },
      ],
    });
    await alerta.present();
  }

  aprobar(u: UsuarioAdmin) {
    return this.aplicar(u, { estadoAprobacion: 'aprobado' }, 'Handyman aprobado');
  }

  async rechazar(u: UsuarioAdmin) {
    const alerta = await this.alertCtrl.create({
      header: 'Rechazar handyman',
      message: `¿Rechazar la solicitud de ${u.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          role: 'confirm',
          handler: () => this.aplicar(u, { estadoAprobacion: 'rechazado' }, 'Solicitud rechazada'),
        },
      ],
    });
    await alerta.present();
  }

  async cerrarSesion() {
    await this.authService.cerrarSesion();
    this.router.navigateByUrl('/login');
  }

  // ───────── Utilidades privadas ─────────
  private async aplicar(u: UsuarioAdmin, datos: Partial<UsuarioAdmin>, exito: string) {
    try {
      await this.adminService.actualizarUsuario(u.uid, datos);
      await this.avisar(exito);
    } catch {
      await this.avisar('No se pudo completar la acción', true);
    }
  }

  private async avisar(mensaje: string, error = false) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2200,
      position: 'bottom',
      color: error ? 'danger' : 'dark',
    });
    await toast.present();
  }
}