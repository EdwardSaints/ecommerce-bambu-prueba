import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user, User as FirebaseUser, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap, tap, delay } from 'rxjs/operators';
import { User, AuthState } from '../interfaces/user.interface';
import { NotificationService } from './notification.service';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  
  private authState = new BehaviorSubject<AuthState>({
    user: null,
    loading: false,
    error: null
  });
  
  public authState$ = this.authState.asObservable();
  public user$ = this.authState$.pipe(map(state => state.user));
  public isAuthenticated$ = this.authState$.pipe(map(state => !!state.user));
  public loading$ = this.authState$.pipe(map(state => state.loading));
  
  constructor() {
    // Modo de desarrollo - cargar usuario mock si existe
    if (environment.useFirebaseEmulator) {
      this.loadMockUser();
      return;
    }

    // Escuchar cambios en el estado de autenticación de Firebase
    user(this.auth).subscribe({
      next: (firebaseUser) => {
        const currentState = this.authState.value;
        if (firebaseUser) {
          this.getUserProfile(firebaseUser.uid).subscribe({
            next: (userProfile) => {
              const appUser: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified,
                ...userProfile
              };
              this.authState.next({
                ...currentState,
                user: appUser,
                loading: false,
                error: null
              });
            },
            error: (error) => {
              console.error('Error al obtener perfil de usuario:', error);
              // Si no se puede obtener el perfil, usar solo datos de Firebase
              const appUser: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified,
                role: 'CUSTOMER'
              };
              this.authState.next({
                ...currentState,
                user: appUser,
                loading: false,
                error: null
              });
            }
          });
        } else {
          this.authState.next({
            ...currentState,
            user: null,
            loading: false,
            error: null
          });
        }
      },
      error: (error) => {
        console.error('Error en autenticación:', error);
        this.authState.next({
          user: null,
          loading: false,
          error: error.message
        });
      }
    });
  }

  private mapFirebaseUserToAppUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
    };
  }

  private async saveUserProfile(uid: string, userData: Partial<User>): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      await setDoc(userRef, userData, { merge: true });
    } catch (error) {
      console.error('Error al guardar perfil de usuario:', error);
      throw error;
    }
  }

  private getUserProfile(uid: string): Observable<Partial<User> | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(getDoc(userRef)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          return snapshot.data() as Partial<User>;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error al obtener perfil de Firestore:', error);
        return of(null);
      })
    );
  }

  register(email: string, password: string, displayName: string): Observable<User> {
    this.authState.next({ ...this.authState.value, loading: true });
    
    // Modo de desarrollo - simular registro
    if (environment.useFirebaseEmulator) {
      return this.mockRegister(email, password, displayName);
    }
    
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async userCredential => {
        const firebaseUser = userCredential.user;
        
        // Actualizar el perfil de Firebase
        await updateProfile(firebaseUser, { displayName });
        
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: displayName,
          emailVerified: firebaseUser.emailVerified,
          role: 'CUSTOMER'
        };
        
        // Guardar perfil adicional en Firestore
        await this.saveUserProfile(firebaseUser.uid, {
          displayName,
          role: 'CUSTOMER',
          firstName: displayName.split(' ')[0] || displayName,
          lastName: displayName.split(' ').slice(1).join(' ') || ''
        });
        
        this.authState.next({
          user: appUser,
          loading: false,
          error: null
        });
        
        this.notificationService.showSuccess('Registro exitoso', `¡Bienvenido, ${displayName}!`);
        return appUser;
      }),
      catchError(error => {
        this.handleAuthError(error);
        this.authState.next({
          user: null,
          loading: false,
          error: error.message
        });
        throw error;
      })
    );
  }

  login(email: string, password: string): Observable<User> {
    this.authState.next({ ...this.authState.value, loading: true });
    
    // Modo de desarrollo - simular login
    if (environment.useFirebaseEmulator) {
      return this.mockLogin(email, password);
    }
    
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(userCredential => 
        this.getUserProfile(userCredential.user.uid).pipe(
          map(userProfile => {
            const appUser: User = {
              ...this.mapFirebaseUserToAppUser(userCredential.user),
              ...userProfile
            };
            
            this.authState.next({
              user: appUser,
              loading: false,
              error: null
            });
            
            this.notificationService.showSuccess('Inicio de sesión exitoso', `¡Bienvenido de nuevo, ${appUser.displayName || appUser.email}!`);
            return appUser;
          })
        )
      ),
      catchError(error => {
        this.handleAuthError(error);
        this.authState.next({
          user: null,
          loading: false,
          error: error.message
        });
        throw error;
      })
    );
  }

  logout(): Observable<void> {
    // Modo de desarrollo - simular logout
    if (environment.useFirebaseEmulator) {
      return this.mockLogout();
    }
    
    return from(signOut(this.auth)).pipe(
      tap(() => {
        this.authState.next({
          user: null,
          loading: false,
          error: null
        });
        this.notificationService.showInfo('Sesión cerrada', 'Has cerrado sesión exitosamente.');
      }),
      catchError(error => {
        this.notificationService.showError('Error al cerrar sesión', 'No se pudo cerrar la sesión.');
        throw error;
      })
    );
  }

  private handleAuthError(error: any): void {
    let errorMessage = 'Ha ocurrido un error de autenticación.';
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'El correo electrónico ya está registrado.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El formato del correo electrónico es inválido.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Operación no permitida. Contacta al soporte.';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña es demasiado débil.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'El usuario ha sido deshabilitado.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
        break;
      case 'auth/popup-closed-by-user':
        errorMessage = 'La ventana de autenticación fue cerrada.';
        break;
      case 'auth/cancelled-popup-request':
        errorMessage = 'Solicitud de autenticación cancelada.';
        break;
      default:
        errorMessage = error.message || errorMessage;
        break;
    }
    this.notificationService.showError('Error de Autenticación', errorMessage);
    console.error('Firebase Auth Error:', error);
  }

  // ========== MÉTODOS MOCK PARA DESARROLLO ==========
  
  private mockUsers = new Map<string, { email: string; password: string; displayName: string; uid: string }>();

  public mockRegister(email: string, password: string, displayName: string): Observable<User> {
    console.log('🔧 Mock Register iniciado:', { email, displayName });
    
    return of(null).pipe(
      delay(1000), // Simular latencia de red
      switchMap(() => {
        console.log('🔧 Procesando registro mock...');
        
        // Cargar usuarios existentes desde localStorage
        const savedUsers = localStorage.getItem('mockUsers');
        if (savedUsers) {
          try {
            const usersArray = JSON.parse(savedUsers);
            this.mockUsers = new Map(usersArray);
          } catch (error) {
            console.error('Error al cargar usuarios mock:', error);
          }
        }
        
        // Verificar si el usuario ya existe
        if (this.mockUsers.has(email)) {
          console.log('🔧 Usuario ya existe:', email);
          const error = { code: 'auth/email-already-in-use', message: 'El correo electrónico ya está registrado.' };
          this.handleAuthError(error);
          return throwError(() => error);
        }

        // Crear usuario mock
        const uid = 'mock-uid-' + Date.now();
        this.mockUsers.set(email, { email, password, displayName, uid });
        
        const appUser: User = {
          uid,
          email,
          displayName,
          emailVerified: false,
          role: 'CUSTOMER',
          firstName: displayName.split(' ')[0] || displayName,
          lastName: displayName.split(' ').slice(1).join(' ') || ''
        };

        console.log('🔧 Usuario mock creado:', appUser);

        // Guardar en localStorage para persistencia
        localStorage.setItem('mockUser', JSON.stringify(appUser));
        localStorage.setItem('mockUsers', JSON.stringify(Array.from(this.mockUsers.entries())));

        this.authState.next({
          user: appUser,
          loading: false,
          error: null
        });

        console.log('🔧 Estado actualizado, mostrando notificación...');
        this.notificationService.showSuccess('Registro exitoso', `¡Bienvenido, ${displayName}! (Modo desarrollo)`);
        return of(appUser);
      }),
      catchError(error => {
        console.error('🔧 Error en mockRegister:', error);
        this.authState.next({
          user: null,
          loading: false,
          error: error.message
        });
        return throwError(() => error);
      })
    );
  }

  public mockLogin(email: string, password: string): Observable<User> {
    return of(null).pipe(
      delay(800), // Simular latencia de red
      switchMap(() => {
        // Cargar usuarios mock desde localStorage
        const savedUsers = localStorage.getItem('mockUsers');
        if (savedUsers) {
          const usersArray = JSON.parse(savedUsers);
          this.mockUsers = new Map(usersArray);
        }

        const mockUser = this.mockUsers.get(email);
        if (!mockUser || mockUser.password !== password) {
          const error = { code: 'auth/invalid-credential', message: 'Credenciales inválidas.' };
          this.handleAuthError(error);
          return throwError(() => error);
        }

        const appUser: User = {
          uid: mockUser.uid,
          email: mockUser.email,
          displayName: mockUser.displayName,
          emailVerified: true,
          role: 'CUSTOMER',
          firstName: mockUser.displayName.split(' ')[0] || mockUser.displayName,
          lastName: mockUser.displayName.split(' ').slice(1).join(' ') || ''
        };

        // Guardar sesión actual
        localStorage.setItem('mockUser', JSON.stringify(appUser));

        this.authState.next({
          user: appUser,
          loading: false,
          error: null
        });

        this.notificationService.showSuccess('Inicio de sesión exitoso', `¡Bienvenido de nuevo, ${appUser.displayName}! (Modo desarrollo)`);
        return of(appUser);
      })
    );
  }

  public mockLogout(): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() => {
        localStorage.removeItem('mockUser');
        this.authState.next({
          user: null,
          loading: false,
          error: null
        });
        this.notificationService.showInfo('Sesión cerrada', 'Has cerrado sesión exitosamente. (Modo desarrollo)');
      })
    );
  }

  // Cargar usuario mock al inicializar (si existe)
  public loadMockUser(): void {
    const savedUser = localStorage.getItem('mockUser');
    if (savedUser && environment.useFirebaseEmulator) {
      try {
        const user = JSON.parse(savedUser);
        this.authState.next({
          user,
          loading: false,
          error: null
        });
        console.log('🔧 Usuario mock cargado:', user);
      } catch (error) {
        console.error('Error al cargar usuario mock:', error);
        localStorage.removeItem('mockUser');
        // Establecer estado inicial sin usuario
        this.authState.next({
          user: null,
          loading: false,
          error: null
        });
      }
    } else {
      // No hay usuario guardado, establecer estado inicial
      console.log('🔧 No hay usuario mock guardado, estableciendo estado inicial');
      this.authState.next({
        user: null,
        loading: false,
        error: null
      });
    }
  }
}