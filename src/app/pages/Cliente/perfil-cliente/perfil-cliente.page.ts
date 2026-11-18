import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  personOutline,
  personCircleOutline,
  mailOutline,
  callOutline,
  locationOutline,
  cameraOutline,
  saveOutline,
  logOutOutline,
  shieldCheckmarkOutline,
  homeOutline,
  clipboardOutline,
  star,
  checkmarkCircleOutline,
  createOutline,
  heartOutline,
  closeOutline,
} from 'ionicons/icons';

import { HeaderClienteComponent } from '../header-cliente/header-cliente.component';
import { AuthService } from '../../../services/auth.service';
import { OperacionesHandymanService } from '../../../services/operaciones-handyman.service';

@Component({
  selector: 'app-perfil-cliente',
  templateUrl: './perfil-cliente.page.html',
  styleUrls: ['./perfil-cliente.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule,
    HeaderClienteComponent,
  ],
})
export class PerfilClientePage {
  private authService = inject(AuthService);
  private operacionesService = inject(OperacionesHandymanService);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  nombre = signal<string>('Cliente');
  email = signal<string>('');
  telefono = signal<string>('');
  fotoUrl = signal<string>('');
  direccionHogar = signal<string>('Chapinero · Bogotá');

  editando = signal<boolean>(false);
  guardando = signal<boolean>(false);

  formNombre = '';
  formTelefono = '';
  formDireccion = 'Chapinero · Bogotá';

  preferenciasHogar = signal<string[]>(['Plomería', 'Electricidad']);
  opcionesCategorias = ['Plomería', 'Electricidad', 'Carpintería', 'Pintura', 'Cerrajería', 'Jardinería'];

  misSolicitudes = this.operacionesService.solicitudesCliente;

  totalSolicitudes = computed(() => this.misSolicitudes().length);
  totalFinalizados = computed(() =>
    this.misSolicitudes().filter((s) => s.estado === 'completada').length
  );

  constructor() {
    addIcons({
      personOutline,
      personCircleOutline,
      mailOutline,
      callOutline,
      locationOutline,
      cameraOutline,
      saveOutline,
      logOutOutline,
      shieldCheckmarkOutline,
      homeOutline,
      clipboardOutline,
      star,
      checkmarkCircleOutline,
      createOutline,
      heartOutline,
      closeOutline,
    });
  }

  async ionViewWillEnter() {
    const usuario = await firstValueFrom(this.authService.currentUser$);
    if (!usuario) return;

    this.email.set(usuario.email || '');
    const perfil = await this.authService.obtenerPerfil(usuario.uid);
    if (perfil) {
      this.nombre.set(perfil.nombre || 'Cliente');
      this.telefono.set(perfil.telefono || '');
      if (perfil.fotoUrl) this.fotoUrl.set(perfil.fotoUrl);

      this.formNombre = this.nombre();
      this.formTelefono = this.telefono();
    }

    await this.operacionesService.cargarSolicitudesCliente();
  }

  alternarPreferencia(cat: string) {
    this.preferenciasHogar.update((actual) =>
      actual.includes(cat) ? actual.filter((c) => c !== cat) : [...actual, cat]
    );
  }

  cargarFotoPerfil(event: any) {
    const archivo = event?.target?.files?.[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        this.fotoUrl.set(reader.result);
        try {
          await this.authService.actualizarPerfilApi({ fotoUrl: reader.result });
          await this.mostrarToast('Foto de perfil actualizada');
        } catch {
          await this.mostrarToast('Foto actualizada localmente');
        }
      }
    };
    reader.readAsDataURL(archivo);
  }

  activarEdicion() {
    this.formNombre = this.nombre();
    this.formTelefono = this.telefono();
    this.formDireccion = this.direccionHogar();
    this.editando.set(true);
  }

  async guardarCambios() {
    if (!this.formNombre.trim() || this.formNombre.trim().length < 2) {
      await this.mostrarToast('El nombre debe tener al menos 2 caracteres');
      return;
    }

    this.guardando.set(true);
    try {
      const actualizado = await this.authService.actualizarPerfilApi({
        nombre: this.formNombre.trim(),
        telefono: this.formTelefono.trim(),
        fotoUrl: this.fotoUrl() || undefined,
      });

      this.nombre.set(actualizado.nombre);
      this.telefono.set(actualizado.telefono || '');
      this.direccionHogar.set(this.formDireccion.trim() || 'Bogotá');
      this.editando.set(false);
      await this.mostrarToast('Perfil guardado en la base de datos');
    } catch (e) {
      await this.mostrarToast('Error al actualizar el perfil');
    } finally {
      this.guardando.set(false);
    }
  }

  async cerrarSesion() {
    await this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  private async mostrarToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'dark',
    });
    await toast.present();
  }
}