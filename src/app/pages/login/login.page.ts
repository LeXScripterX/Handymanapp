import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonInput,
  IonButton,
  ToastController,
  MenuController,
} from '@ionic/angular/standalone';
import { AuthService, UserRole } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonInput,
    IonButton,
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  rolSeleccionado: UserRole = 'cliente';
  cargando = false;

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private menuCtrl: MenuController
  ) {}

  ionViewWillEnter() {
    this.menuCtrl.enable(false);
  }


  seleccionarRol(rol: string | number | undefined) {
    if (rol === 'cliente' || rol === 'handyman') {
      this.rolSeleccionado = rol;
    }
  }


async ingresar() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.cargando = true;
  const { email, password } = this.form.value;

  try {
    await this.authService.iniciarSesion(email, password);
    const uid = this.authService['auth'].currentUser?.uid;
    const perfil = uid ? await this.authService.obtenerPerfil(uid) : null;

    if (perfil?.rol === 'admin') {
      this.router.navigateByUrl('/admin', { replaceUrl: true });
    } else {
      this.router.navigateByUrl('/home', { replaceUrl: true });
    }
  } catch (error: any) {
    await this.mostrarError(this.traducirError(error?.code));
  } finally {
    this.cargando = false;
  }
}
  irARegistro() {
    this.router.navigate(['/register'], {
      queryParams: { rol: this.rolSeleccionado },
    });
  }

  private async mostrarError(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  }

  private traducirError(codigo: string): string {
    switch (codigo) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Correo o contraseña incorrectos.';
      case 'auth/invalid-email':
        return 'El correo no es válido.';
      default:
        return 'Ocurrió un error al iniciar sesión. Intenta de nuevo.';
    }
  }
}
