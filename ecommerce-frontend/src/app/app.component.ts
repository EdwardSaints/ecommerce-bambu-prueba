import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from './core/services/auth.service';
import { NotificationService, Notification } from './core/services/notification.service';
import { User } from './core/interfaces/user.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Observables
  user$: Observable<User | null> = this.authService.user$;
  isAuthenticated$: Observable<boolean> = this.authService.isAuthenticated$;
  notifications$: Observable<Notification[]> = this.notificationService.notifications$;

  // Estado del componente
  showUserMenu = false;

  ngOnInit(): void {
    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        this.showUserMenu = false;
      }
    });
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  getUserInitials(user: User): string {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user.email.charAt(0).toUpperCase();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.closeUserMenu();
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
      }
    });
  }

  dismissNotification(id: string): void {
    this.notificationService.dismiss(id);
  }
}
