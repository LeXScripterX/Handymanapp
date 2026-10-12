import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-header-handyman',
  templateUrl: './header-handyman.component.html',
  styleUrls: ['./header-handyman.component.scss'],
  standalone: true,
  imports: [IonicModule] // <-- Importante para que funcionen las etiquetas <ion-*>
})
export class HeaderHandymanComponent implements OnInit {
  constructor() {}
  ngOnInit() {}
}