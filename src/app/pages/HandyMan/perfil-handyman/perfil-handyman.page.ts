import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, IonIcon, IonModal, 
  AlertController 
} from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import { 
  camera, checkmarkCircle, star, briefcase, time, 
  water, flash, add, imageOutline, cloudUploadOutline, 
  logOutOutline, pencil, build, personCircleOutline, 
  mailOutline, callOutline, lockClosedOutline, closeOutline,
  key, hammer, tv, addCircle, checkmarkDoneCircleOutline
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { HeaderHandymanComponent } from '../header-handyman/header-handyman.component';

interface ServicioHandyman {
  id: string;
  nombre: string;
  nombreCorto: string; 
  descripcion: string;
  icono: string;
  claseColor: string;
  precioBase: number; 
}

interface FotoPortafolio {
  id: number;
  servicioId: string;
  url: string; 
}

@Component({
  selector: 'app-perfil-handyman',
  templateUrl: './perfil-handyman.page.html',
  styleUrls: ['./perfil-handyman.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    IonContent, 
    IonIcon, 
    IonModal, 
    HeaderHandymanComponent
  ]
})
export class PerfilHandymanPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private formBuilder = inject(FormBuilder);

  modalEdicionAbierto = signal<boolean>(false);
  modalServiciosAbierto = signal<boolean>(false);
  guardandoCambios = false;
  
  formEdicion: FormGroup;

  nombreTrabajador = signal<string>('Cargando...');
  correoTrabajador = signal<string>('');
  celularTrabajador = signal<string>('');
  fotoPerfil = signal<string>('');

  misServicios = signal<ServicioHandyman[]>([
    {
      id: 'plom_basica',
      nombre: 'Plomería Básica',
      nombreCorto: 'Plomería',
      descripcion: 'Reparación de fugas, grifos y tuberías',
      icono: 'water',
      claseColor: 'bg-plomeria',
      precioBase: 50000 
    }
  ]);

  catalogoServicios: ServicioHandyman[] = [
    { id: 'plom_basica', nombre: 'Plomería Básica', nombreCorto: 'Plomería', descripcion: 'Reparación de fugas, grifos y tuberías', icono: 'water', claseColor: 'bg-plomeria', precioBase: 50000 },
    { id: 'plom_calentador', nombre: 'Revisión Calentadores', nombreCorto: 'Calentadores', descripcion: 'Mantenimiento de calentadores a gas y eléctricos', icono: 'water', claseColor: 'bg-plomeria', precioBase: 80000 },
    { id: 'elec_basica', nombre: 'Electricidad Básica', nombreCorto: 'Electricidad', descripcion: 'Cambio de tomas, rosetas y lámparas', icono: 'flash', claseColor: 'bg-electricidad', precioBase: 60000 },
    { id: 'elec_cableado', nombre: 'Reparación de Cableado', nombreCorto: 'Cableado', descripcion: 'Detección y solución de cortocircuitos', icono: 'flash', claseColor: 'bg-electricidad', precioBase: 120000 },
    { id: 'cerra_apertura', nombre: 'Apertura de Puertas', nombreCorto: 'Cerrajero', descripcion: 'Apertura sin daños y cambio de guardas', icono: 'key', claseColor: 'bg-cerrajeria', precioBase: 70000 },
    { id: 'carp_muebles', nombre: 'Ensamblaje de Muebles', nombreCorto: 'Ensamblaje', descripcion: 'Armado de muebles de caja listos para ensamblar', icono: 'hammer', claseColor: 'bg-carpinteria', precioBase: 65000 },
    { id: 'gen_tv', nombre: 'Instalación Soporte TV', nombreCorto: 'Soportes TV', descripcion: 'Fijación segura de bases para televisores', icono: 'tv', claseColor: 'bg-general', precioBase: 55000 }
  ];

  serviciosDisponibles = computed(() => {
    const misIds = this.misServicios().map(s => s.id);
    return this.catalogoServicios.filter(s => !misIds.includes(s.id));
  });

  galeriaTotal = signal<FotoPortafolio[]>([
    { id: 1, servicioId: 'plom_basica', url: '' },
    { id: 2, servicioId: 'elec_basica', url: '' },
  ]);

  filtroPortafolio = signal<string>('todos');

  fotosFiltradas = computed(() => {
    const filtro = this.filtroPortafolio();
    const todas = this.galeriaTotal();
    if (filtro === 'todos') return todas;
    return todas.filter(foto => foto.servicioId === filtro);
  });

  constructor() {
    addIcons({
      camera, checkmarkCircle, star, briefcase, time, 
      water, flash, add, imageOutline, cloudUploadOutline, 
      logOutOutline, pencil, build, personCircleOutline, 
      mailOutline, callOutline, lockClosedOutline, closeOutline,
      key, hammer, tv, addCircle, checkmarkDoneCircleOutline
    });

    this.formEdicion = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^[0-9]+$/)]],
      password: ['', [Validators.minLength(6)]] 
    });
  }

  async ngOnInit() {
    await this.cargarDatosUsuario();
  }

  async cargarDatosUsuario() {
    try {
      const usuario = await firstValueFrom(this.authService.currentUser$) as any;
      if (!usuario) return;
      if (usuario.email) this.correoTrabajador.set(usuario.email);

      const perfil = await this.authService.obtenerPerfil(usuario.uid) as any;
      if (perfil) {
        if (perfil.nombre) this.nombreTrabajador.set(perfil.nombre);
        if (perfil.email) this.correoTrabajador.set(perfil.email);
        if (perfil.celular) this.celularTrabajador.set(perfil.celular);
        if (perfil.fotoPerfil) this.fotoPerfil.set(perfil.fotoPerfil);
      } else {
        this.nombreTrabajador.set(usuario.displayName || 'Handyman');
      }
    } catch (error) {
      console.error('Error cargando el perfil:', error);
      this.nombreTrabajador.set('Usuario');
    }
  }

  abrirModalEdicion() {
    this.formEdicion.patchValue({
      nombre: this.nombreTrabajador(),
      email: this.correoTrabajador(),
      celular: this.celularTrabajador(),
      password: ''
    });
    this.modalEdicionAbierto.set(true);
  }

  cerrarModalEdicion() {
    this.modalEdicionAbierto.set(false);
  }

  abrirModalServicios() {
    this.modalServiciosAbierto.set(true);
  }

  cerrarModalServicios() {
    this.modalServiciosAbierto.set(false);
  }

  seleccionarServicio(servicio: ServicioHandyman) {
    this.misServicios.update(actuales => [...actuales, servicio]);
    this.cerrarModalServicios();
    setTimeout(() => {
      this.editarPrecio(servicio);
    }, 300); 
  }

  sanitizarNombre(event: Event) {
    const input = event.target as HTMLInputElement;
    const valorLimpio = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    if (input.value !== valorLimpio) {
      this.formEdicion.get('nombre')?.setValue(valorLimpio, { emitEvent: false });
      input.value = valorLimpio;
    }
  }

  sanitizarCelular(event: Event) {
    const input = event.target as HTMLInputElement;
    const valorLimpio = input.value.replace(/[^0-9]/g, '');
    if (input.value !== valorLimpio) {
      this.formEdicion.get('celular')?.setValue(valorLimpio, { emitEvent: false });
      input.value = valorLimpio;
    }
  }

  async guardarCambiosPerfil() {
    if (this.formEdicion.invalid) {
      this.formEdicion.markAllAsTouched();
      return;
    }
    this.guardandoCambios = true;
    const { nombre, email, celular } = this.formEdicion.value;
    try {
      this.nombreTrabajador.set(nombre);
      this.correoTrabajador.set(email);
      this.celularTrabajador.set(celular);
      this.cerrarModalEdicion();
    } catch (error) {
      console.error('Error simulando actualización:', error);
    } finally {
      this.guardandoCambios = false;
    }
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  }

  async editarPrecio(servicio: ServicioHandyman) {
    const alert = await this.alertCtrl.create({
      header: 'Editar tarifa base',
      subHeader: servicio.nombre,
      message: 'Ingresa el valor exacto en pesos (ej: 50000 o 1500000).',
      cssClass: 'alerta-moderna',
      inputs: [
        {
          name: 'nuevoPrecio',
          type: 'number',
          placeholder: 'Ej: 50000',
          value: servicio.precioBase
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'btn-alerta-cancelar' },
        {
          text: 'Guardar',
          cssClass: 'btn-alerta-guardar',
          handler: (data) => {
            if (data.nuevoPrecio) {
              const valorNumerico = parseInt(data.nuevoPrecio, 10);
              if (!isNaN(valorNumerico) && valorNumerico >= 0) {
                this.misServicios.update(servicios => 
                  servicios.map(s => 
                    s.id === servicio.id ? { ...s, precioBase: valorNumerico } : s
                  )
                );
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  setFiltro(filtroId: string) {
    this.filtroPortafolio.set(filtroId);
  }

  subirFoto() {
    console.log('Abrir selector de imágenes o cámara');
  }

  obtenerClaseServicio(id: string): string {
    const serv = this.misServicios().find(s => s.id === id);
    return serv ? serv.claseColor : 'bg-default';
  }

  obtenerIconoServicio(id: string): string {
    const serv = this.misServicios().find(s => s.id === id);
    return serv ? serv.icono : 'build';
  }

  async cerrarSesion() {
    try {
      await this.authService.cerrarSesion();
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}