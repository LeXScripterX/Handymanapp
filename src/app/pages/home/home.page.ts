import { Component } from '@angular/core';
import { MenuPage } from '../../components/menu/menu.page';
import { addIcons } from 'ionicons';
import { logoAndroid}  from 'ionicons/icons';
import { 
  IonHeader, 
  IonContent, 
  IonIcon
} from '@ionic/angular';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonContent, MenuPage, IonIcon],
})
export class HomePage {
 constructor() {
  addIcons({ logoAndroid});
 }
}
