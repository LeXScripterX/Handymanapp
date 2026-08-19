import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonMenu,
  IonButtons,
  IonMenuButton,
  IonAvatar,
  IonLabel,
  IonItemDivider,
  IonList,
  IonMenuToggle,

} from '@ionic/angular';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonMenu,
    IonButtons,
    IonMenuButton,
    IonAvatar,
    IonLabel,
    IonItemDivider,
    IonList,
    IonMenuToggle,
  
  ]
})

export class MenuPage {
  constructor() {}
}