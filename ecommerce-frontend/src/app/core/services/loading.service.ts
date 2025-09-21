import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoadingState } from '../interfaces/api.interface';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingState = new BehaviorSubject<LoadingState>({});
  private globalLoadingSubject = new BehaviorSubject<boolean>(false);
  private activeRequests = 0;

  public loading$ = this.loadingState.asObservable();
  public globalLoading$ = this.globalLoadingSubject.asObservable();

  show(): void {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      this.globalLoadingSubject.next(true);
    }
  }

  hide(): void {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      this.globalLoadingSubject.next(false);
    }
  }

  setLoading(key: string, loading: boolean): void {
    const currentState = this.loadingState.value;
    
    if (loading) {
      this.loadingState.next({
        ...currentState,
        [key]: true
      });
    } else {
      const newState = { ...currentState };
      delete newState[key];
      this.loadingState.next(newState);
    }
  }

  isLoading(key?: string): Observable<boolean> {
    return new Observable(observer => {
      this.loading$.subscribe(state => {
        if (key) {
          observer.next(!!state[key]);
        } else {
          observer.next(Object.keys(state).length > 0);
        }
      });
    });
  }

  isAnyLoading(): Observable<boolean> {
    return this.globalLoading$;
  }
}