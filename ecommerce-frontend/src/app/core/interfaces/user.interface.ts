export interface User {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  // Puedes añadir más campos si los almacenas en Firestore para el perfil
  firstName?: string;
  lastName?: string;
  address?: string;
  phone?: string;
  role?: 'CUSTOMER' | 'ADMIN';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
