import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
  MenuController,
} from '@ionic/angular/standalone';
import { AuthService, UserRole } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [IonButtons, IonContent, IonHeader, IonMenuButton, IonTitle, IonToolbar],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="light"></ion-menu-button>
        </ion-buttons>
        <ion-title>Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="contenido">
        <div class="avatar">{{ inicial() }}</div>
        <h2>{{ nombre() }}</h2>
        <p class="correo">{{ email() }}</p>
        <span class="pill">{{ etiquetaRol() }}</span>

        <button type="button" class="salir" (click)="cerrarSesion()">Cerrar sesión</button>
      </div>
    </ion-content>
  `,
  styles: [
    `
      ion-toolbar {
        --background: #1f2d3a;
        --color: #ffffff;
        --border-width: 0;
        --min-height: 64px;
      }

      ion-content {
        --background: #f6f3ee;
      }

      .contenido {
        max-width: 420px;
        margin: 0 auto;
        padding: 32px 16px;
        text-align: center;
        color: #1f2d3a;
      }

      .avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 88px;
        height: 88px;
        margin: 0 auto 12px;
        border-radius: 50%;
        background: #1f2d3a;
        color: #ffffff;
        font-size: 36px;
        font-weight: 700;
      }

      h2 {
        margin: 0 0 4px;
      }

      .correo {
        margin: 0 0 12px;
        color: #7b848c;
      }

      .pill {
        display: inline-block;
        padding: 6px 16px;
        border-radius: 999px;
        background: rgba(31, 45, 58, 0.1);
        font-weight: 600;
      }

      .salir {
        display: block;
        width: 100%;
        margin-top: 32px;
        padding: 14px;
        background: #ef6a5a;
        color: #ffffff;
        border: 0;
        border-radius: 999px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
      }
    `,
  ],
})
export class PerfilPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private menuCtrl = inject(MenuController);

  nombre = signal('');
  email = signal('');
  rol = signal<UserRole>('cliente');
  inicial = computed(() => this.nombre().charAt(0).toUpperCase());
  etiquetaRol = computed(() => {
    const etiquetas: Record<UserRole, string> = {
      cliente: 'Cliente',
      handyman: 'Handyman',
      admin: 'Admin',
    };
    return etiquetas[this.rol()];
  });

  async ionViewWillEnter() {
    this.menuCtrl.enable(window.matchMedia('(min-width: 992px)').matches);

    const usuario = await firstValueFrom(this.authService.currentUser$);
    if (!usuario) return;

    const perfil = await this.authService.obtenerPerfil(usuario.uid);
    if (perfil) {
      this.nombre.set(perfil.nombre);
      this.email.set(perfil.email);
      this.rol.set(perfil.rol);
    }
  }

  async cerrarSesion() {
    await this.authService.cerrarSesion();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
