import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { MenuPage } from './components/menu/menu.page';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp,MenuPage, IonRouterOutlet],
})
export class AppComponent {
  constructor() {}
}
