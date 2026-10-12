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
            [class.activo]="rutaActual().includes(tab.ruta)"
            (click)="ir(tab.ruta)"
          >
            <ion-icon [name]="tab.icono"></ion-icon>
            <span>{{ tab.etiqueta }}</span>
          </button>
        }
      </nav>
    }
  `,
  styleUrls:[`./bottom-tabs.scss`],
})
export class BottomTabsComponent {
  private router = inject(Router);
  private menuCtrl = inject(MenuController);

  // Actualizamos las rutas para que coincidan con los nuevos nombres de página
  readonly tabs: Tab[] = [
    { ruta: '/home-handyman', etiqueta: 'Inicio', icono: 'home-outline' },
    { ruta: '/operaciones-handyman', etiqueta: 'Operaciones', icono: 'clipboard-outline' },
    // CAMBIO CLAVE: Actualizamos la ruta a '/perfil-handyman'
    { ruta: '/perfil-handyman', etiqueta: 'Perfil', icono: 'person-outline' },
  ];

  private mediaEscritorio = window.matchMedia('(min-width: 992px)');
  esEscritorio = signal(this.mediaEscritorio.matches);
  rutaActual = signal(this.router.url);
  
  // Hacemos que sea visible si la ruta actual incluye alguna de las rutas de los tabs
  visible = computed(() => this.tabs.some((t) => this.rutaActual().includes(t.ruta)));

  constructor() {
    addIcons({ homeOutline, clipboardOutline, personOutline });

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((e) => this.rutaActual.set(e.urlAfterRedirects));

    this.mediaEscritorio.addEventListener('change', (e) => this.esEscritorio.set(e.matches));

    effect(() => {
      document.body.classList.toggle('con-tabs', this.visible());
    });

    effect(() => {
      this.menuCtrl.enable(this.esEscritorio() && this.visible());
    });
  }

  ir(ruta: string) {
    this.router.navigateByUrl(ruta);
  }
}