import { Component } from '@angular/core';
import { addIcons } from 'ionicons';
import { logoAndroid } from 'ionicons/icons';
import { 
  IonHeader, 
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonContent, 
  IonIcon,
  MenuController,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonMenuButton, 
    IonContent, 
    IonIcon
  ],
})
export class HomePage {
  constructor(private menuCtrl: MenuController) {
    addIcons({ logoAndroid });
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(true);
  }
}

