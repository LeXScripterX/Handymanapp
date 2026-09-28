import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
import { AuthService } from '../../services/auth.service';

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
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async cerrasrSession() {
    await this.authService.cerrarSesion();
    this.router.navigateByUrl('/login', { replaceUrl: true});
  }
}