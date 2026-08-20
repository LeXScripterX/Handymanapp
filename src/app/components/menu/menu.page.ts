import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar,IonMenu,
         IonButtons,IonMenuButton,IonAvatar,IonLabel,IonList,
         IonItem,IonMenuToggle,}
        from '@ionic/angular';


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
    IonButtons,
    IonMenuButton,
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