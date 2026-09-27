import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonMenu, 
  IonAvatar, 
  IonLabel, 
  IonList, 
  IonItem, 
  IonMenuToggle 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonMenu,
    IonAvatar,
    IonLabel,
    IonList,
    IonItem,
    IonMenuToggle
  ]
})
export class MenuPage {
  constructor() {}
}