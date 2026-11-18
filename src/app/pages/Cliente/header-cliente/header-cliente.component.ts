import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-header-cliente',
  templateUrl: './header-cliente.component.html',
  styleUrls: ['./header-cliente.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class HeaderClienteComponent implements OnInit {
  constructor() {
    addIcons({ notificationsOutline });
  }

  ngOnInit() {}
}