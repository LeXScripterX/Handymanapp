import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  ToastController,
  MenuController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline, 
  constructOutline, 
  mailOutline, 
  lockClosedOutline,
  logoFacebook
} from 'ionicons/icons';
import { AuthService, UserRole } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  rolSeleccionado: UserRole = 'cliente';
  cargando = signal(false);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private menuCtrl: MenuController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      personOutline,
      constructOutline,
      mailOutline,
      lockClosedOutline,
      logoFacebook
    });
  }

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

    this.cargando.set(true);
    const { email, password } = this.form.value;

    try {
      const credenciales = await this.authService.iniciarSesion(email, password);
      const perfil = await this.authService.obtenerPerfil(credenciales.user.uid);
      this.redirigirSegunRol(perfil?.rol);
    } catch (error: any) {
      await this.mostrarError(this.traducirError(error?.code));
    } finally {
      this.cargando.set(false);
    }
  }

  async loginGoogle() {
    this.cargando.set(true);
    try {
      const perfil = await this.authService.loginConGoogle(this.rolSeleccionado);
      this.redirigirSegunRol(perfil?.rol);
    } catch (error: any) {
      console.error('Error login Google:', error);
      if (error?.code !== 'auth/popup-closed-by-user') {
        await this.mostrarError(this.traducirError(error?.code));
      }
    } finally {
      this.cargando.set(false);
    }
  }

  async loginFacebook() {
    this.cargando.set(true);
    try {
      const perfil = await this.authService.loginConFacebook(this.rolSeleccionado);
      this.redirigirSegunRol(perfil?.rol);
    } catch (error: any) {
      console.error('Error login Facebook:', error);
      if (error?.code !== 'auth/popup-closed-by-user') {
        await this.mostrarError(this.traducirError(error?.code));
      }
    } finally {
      this.cargando.set(false);
    }
  }

  private redirigirSegunRol(rol: UserRole | undefined) {
    const rutas: Record<UserRole, string> = {
      cliente: '/home-cliente',
      handyman: '/home-handyman',
      admin: '/admin',
    };
    this.router.navigateByUrl(rutas[rol ?? 'cliente'], { replaceUrl: true });
  }

  irARegistro() {
    this.router.navigate(['/register'], {
      queryParams: { rol: this.rolSeleccionado },
    });
  }

  async olvideContrasena() {
    const emailActual = (this.form.get('email')?.value || '').trim();

    const alert = await this.alertCtrl.create({
      header: 'Recuperar contraseña',
      subHeader: 'Ingresa tu correo y te enviaremos un enlace para restablecerla.',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'tu@correo.com',
          value: emailActual,
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Enviar enlace',
          handler: async (data) => {
            const correo = (data?.email || '').trim();
            if (!correo) {
              await this.mostrarError('Por favor ingresa un correo electrónico.');
              return false;
            }
            try {
              await this.authService.restablecerContrasena(correo);
              await this.mostrarExito('¡Correo enviado! Revisa tu bandeja de entrada o spam para restablecer tu contraseña.');
              return true;
            } catch (error: any) {
              const msg = error?.code === 'auth/user-not-found'
                ? 'No encontramos ninguna cuenta con ese correo.'
                : this.traducirError(error?.code);
              await this.mostrarError(msg);
              return false;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  private async mostrarError(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  }

  private async mostrarExito(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 4000,
      color: 'success',
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
      case 'auth/account-exists-with-different-credential':
        return 'Ya existe una cuenta con este correo vinculada a otro método de acceso.';
      case 'auth/popup-blocked':
        return 'El navegador bloqueó la ventana emergente. Por favor habilítala.';
      case 'auth/operation-not-allowed':
        return 'Este método de acceso aún no está habilitado en Firebase Console.';
      case 'auth/unauthorized-domain':
        return 'Dominio no autorizado. Agrega este dominio en Firebase Console > Authentication > Settings > Dominios autorizados.';
      case 'auth/cancelled-popup-request':
        return 'Inicio de sesión cancelado.';
      default:
        return 'Ocurrió un error al iniciar sesión. Intenta de nuevo.';
    }
  }
}