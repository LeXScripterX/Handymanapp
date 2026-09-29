import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonInput,
  IonButton,
} from '@ionic/angular/standalone';
import { AuthService, UserRole } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonInput,
    IonButton,
  ],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  rolSeleccionado: UserRole = 'cliente';
  cargando = false;

  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    const rolQuery = this.route.snapshot.queryParamMap.get('rol') as UserRole;
    if (rolQuery === 'cliente' || rolQuery === 'handyman') {
      this.rolSeleccionado = rolQuery;
    }
  }

  seleccionarRol(rol: string | number | undefined) {
    if (rol === 'cliente' || rol === 'handyman') {
      this.rolSeleccionado = rol;
    }
  }

  async registrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nombre, email, password, confirmarPassword } = this.form.value;

    if (password !== confirmarPassword) {
      await this.mostrarError('Las contraseñas no coinciden.');
      return;
    }

    this.cargando = true;
    try {
      await this.authService.registrar(email, password, nombre, this.rolSeleccionado);
      const ruta = this.rolSeleccionado === 'handyman' ? '/home-handyman' : '/home-cliente';
      this.router.navigateByUrl(ruta, { replaceUrl: true });
    } catch (error: any) {
      await this.mostrarError(this.traducirError(error?.code));
    } finally {
      this.cargando = false;
    }
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
      case 'auth/email-already-in-use':
        return 'Ese correo ya está registrado.';
      case 'auth/invalid-email':
        return 'El correo no es válido.';
      case 'auth/weak-password':
        return 'La contraseña es muy débil (mínimo 6 caracteres).';
      default:
        return 'Ocurrió un error al crear la cuenta. Intenta de nuevo.';
    }
  }
}
