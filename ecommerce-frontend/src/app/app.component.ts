import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
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
  private cartService = inject(CartService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // Observables
  user$: Observable<User | null> = this.authService.user$;
  isAuthenticated$: Observable<boolean> = this.authService.isAuthenticated$;
  notifications$: Observable<Notification[]> = this.notificationService.notifications$;
  cartSummary$ = this.cartService.getCartSummary();

  // Estado del componente
  showUserMenu = false;

  ngOnInit(): void {
    // Cerrar menú al hacer click fuera del área del usuario
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const userMenuContainer = target.closest('.relative');
      const isUserMenuButton = target.closest('button[aria-label="user-menu"]');
      const isInsideDropdown = target.closest('.user-dropdown');
      
      // Solo cerrar si el click NO es en el botón del usuario NI dentro del dropdown
      if (!isUserMenuButton && !isInsideDropdown) {
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

  handleLogout(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.showUserMenu = false;
    
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        // Error handling can be added here if needed
      }
    });
  }

  logout(): void {
    this.closeUserMenu();
    
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        // Error handling can be added here if needed
      }
    });
  }

  dismissNotification(id: string): void {
    this.notificationService.dismiss(id);
  }
}
