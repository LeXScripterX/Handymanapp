import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonMenuButton, 
  MenuController 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-operaciones',
  templateUrl: './operaciones.page.html',
  styleUrls: ['./operaciones.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons, 
    IonMenuButton, 
    CommonModule, 
    FormsModule
  ]
})
export class OperacionesPage {
  constructor(private menuCtrl: MenuController) {}

  ionViewWillEnter() {
   this.menuCtrl.enable(window.matchMedia('(min-width: 992px)').matches);
  }
}

