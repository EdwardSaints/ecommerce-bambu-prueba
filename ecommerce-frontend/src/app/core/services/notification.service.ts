import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notifications.asObservable();
  
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
  
  private addNotification(notification: Omit<Notification, 'id'>): void {
    const newNotification: Notification = {
      id: this.generateId(),
      dismissible: true,
      duration: 5000,
      ...notification
    };
    
    const current = this.notifications.value;
    this.notifications.next([...current, newNotification]);
    
    // Auto-dismiss después del tiempo especificado
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.dismiss(newNotification.id);
      }, newNotification.duration);
    }
  }
  
  showSuccess(message: string, title?: string, duration?: number): void {
    this.addNotification({
      type: 'success',
      title,
      message,
      duration
    });
  }
  
  showError(message: string, title?: string, duration?: number): void {
    this.addNotification({
      type: 'error',
      title: title || 'Error',
      message,
      duration: duration || 8000 // Errores duran más tiempo
    });
  }
  
  showWarning(message: string, title?: string, duration?: number): void {
    this.addNotification({
      type: 'warning',
      title,
      message,
      duration
    });
  }
  
  showInfo(message: string, title?: string, duration?: number): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      duration
    });
  }

  showWarn(message: string, title?: string, duration?: number): void {
    this.addNotification({
      type: 'warning',
      title,
      message,
      duration
    });
  }
  
  dismiss(id: string): void {
    const current = this.notifications.value;
    this.notifications.next(current.filter(n => n.id !== id));
  }
  
  dismissAll(): void {
    this.notifications.next([]);
  }
}
