import { Component } from '@angular/core';

import { IonApp, IonRouterOutlet,  } from '@ionic/angular/standalone';
import { MenuPage } from './components/menu/menu.page';
import { BottomTabsComponent } from './components/bottom-tabs/bottom-tabs.component';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp,MenuPage, IonRouterOutlet, BottomTabsComponent],
})
export class AppComponent {
  constructor() {}
}
