import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline, 
  constructOutline, 
  mailOutline, 
  lockClosedOutline, 
  personCircleOutline,
  callOutline,
  shieldCheckmarkOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { AuthService, UserRole } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
  ],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  rolSeleccionado: UserRole = 'cliente';
  cargando = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController
  ) {
    addIcons({
      personOutline,
      constructOutline,
      mailOutline,
      lockClosedOutline,
      personCircleOutline,
      callOutline,
      shieldCheckmarkOutline,
      arrowBackOutline
    });

    this.form = this.fb.group({
      // Se agregó Pattern para validar que el nombre solo tenga letras (incluye tildes y ñ) y espacios.
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      // Se exige patrón exclusivamente numérico y largo de 10
      celular: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern(/^[0-9]+$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', [Validators.required]],
      terminos: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    const rolQuery = this.route.snapshot.queryParamMap.get('rol') as UserRole;
    if (rolQuery === 'cliente' || rolQuery === 'handyman') {
      this.rolSeleccionado = rolQuery;
    }
  }

  // --- MÉTODOS DE SANITIZACIÓN EN TIEMPO REAL ---

  // Borra instantáneamente cualquier cosa que no sean letras o espacios
  sanitizarNombre(event: Event) {
    const input = event.target as HTMLInputElement;
    const valorLimpio = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    
    if (input.value !== valorLimpio) {
      this.form.get('nombre')?.setValue(valorLimpio, { emitEvent: false });
      input.value = valorLimpio; // Fuerza el cambio visual
    }
  }

  // Borra instantáneamente cualquier cosa que no sean números
  sanitizarCelular(event: Event) {
    const input = event.target as HTMLInputElement;
    const valorLimpio = input.value.replace(/[^0-9]/g, '');
    
    if (input.value !== valorLimpio) {
      this.form.get('celular')?.setValue(valorLimpio, { emitEvent: false });
      input.value = valorLimpio; // Fuerza el cambio visual
    }
  }

  // ----------------------------------------------

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmarPassword = control.get('confirmarPassword')?.value;
    if (password !== confirmarPassword) {
      return { mismatch: true };
    }
    return null;
  }

  async registrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      
      if (!this.form.get('terminos')?.value) {
        this.mostrarError('Debes aceptar los términos y condiciones para continuar.');
      }
      return;
    }

    this.cargando = true;
    const { email, password, nombre, celular } = this.form.value;

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
      duration: 3000,
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