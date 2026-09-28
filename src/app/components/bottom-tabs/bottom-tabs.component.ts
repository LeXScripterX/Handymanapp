import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { IonIcon, MenuController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { clipboardOutline, homeOutline, personOutline } from 'ionicons/icons';
import { filter } from 'rxjs';

interface Tab {
  ruta: string;
  etiqueta: string;
  icono: string;
}

@Component({
  selector: 'app-bottom-tabs',
  standalone: true,
  imports: [IonIcon],
  template: `
    @if (visible()) {
      <nav class="tabs">
        @for (tab of tabs; track tab.ruta) {
          <button
            type="button"
            class="tab"
            [class.activo]="rutaActual().startsWith(tab.ruta)"
            (click)="ir(tab.ruta)"
          >
            <ion-icon [name]="tab.icono"></ion-icon>
            <span>{{ tab.etiqueta }}</span>
          </button>
        }
      </nav>
    }
  `,
  styles: [
    `
      .tabs {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: calc(12px + env(safe-area-inset-bottom, 0px));
        max-width: 520px;
        margin: 0 auto;
        z-index: 100;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 6px 4px;
        background: #ffffff;
        border: 1.5px solid #d5cfc6;
        border-radius: 24px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
      }

      .tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 6px 0;
        background: none;
        border: 0;
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        color: #7b848c;
        cursor: pointer;
      }

      .tab ion-icon {
        font-size: 22px;
      }

      .tab.activo {
        color: #ef6a5a;
      }

      /* En web/PC los tabs no se muestran: se usa el menú lateral */
      @media (min-width: 992px) {
        .tabs {
          display: none;
        }
      }
    `,
  ],
})
export class BottomTabsComponent {
  private router = inject(Router);
  private menuCtrl = inject(MenuController);

  readonly tabs: Tab[] = [
    { ruta: '/home', etiqueta: 'Inicio', icono: 'home-outline' },
    { ruta: '/operaciones', etiqueta: 'Operaciones', icono: 'clipboard-outline' },
    { ruta: '/perfil', etiqueta: 'Perfil', icono: 'person-outline' },
  ];

  private mediaEscritorio = window.matchMedia('(min-width: 992px)');
  esEscritorio = signal(this.mediaEscritorio.matches);
  rutaActual = signal(this.router.url);
  visible = computed(() => this.tabs.some((t) => this.rutaActual().startsWith(t.ruta)));

  constructor() {
    addIcons({ homeOutline, clipboardOutline, personOutline });

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((e) => this.rutaActual.set(e.urlAfterRedirects));

    // Se actualiza al cambiar el tamaño de la ventana (ej. pantalla completa)
    this.mediaEscritorio.addEventListener('change', (e) => this.esEscritorio.set(e.matches));

    // Deja espacio abajo para los tabs (ver global.scss)
    effect(() => {
      document.body.classList.toggle('con-tabs', this.visible());
    });

    // Menú lateral: solo en web/PC y solo en las pantallas con tabs (no en login/registro/admin)
    effect(() => {
      this.menuCtrl.enable(this.esEscritorio() && this.visible());
    });
  }

  ir(ruta: string) {
    this.router.navigateByUrl(ruta);
  }
}