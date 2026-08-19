import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
//import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
@Component({
  selector: 'app-operaciones',
  templateUrl: './operaciones.page.html',
  styleUrls: ['./operaciones.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class OperacionesPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
