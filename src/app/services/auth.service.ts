import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
  User,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
} from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';

export type UserRole = 'cliente' | 'handyman' | 'admin';

export interface AppUser {
  uid: string;
  email: string;
  nombre: string;
  rol: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);

  // Observable con el usuario autenticado (o null) en tiempo real.
  currentUser$: Observable<User | null> = user(this.auth);

  // Observable con los datos completos del usuario desde Firestore (incluye el rol)
  currentUserProfile$: Observable<AppUser | null> = this.currentUser$.pipe(
    switchMap((u) => (u ? this.obtenerPerfil(u.uid) : of(null)))
  );


  async registrar(
    email: string,
    password: string,
    nombre: string,
    rol: UserRole
  ): Promise<void> {
    const credenciales = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    const nuevoUsuario: AppUser = {
      uid: credenciales.user.uid,
      email,
      nombre,
      rol,
    };

    // Guardamos el rol y datos extra en Firestore, en users/{uid}
    await setDoc(doc(this.firestore, `users/${credenciales.user.uid}`), nuevoUsuario);
  }

  async iniciarSesion(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async cerrarSesion(): Promise<void> {
    await signOut(this.auth);
  }

  async obtenerPerfil(uid: string): Promise<AppUser | null> {
    const snap = await getDoc(doc(this.firestore, `users/${uid}`));
    return snap.exists() ? (snap.data() as AppUser) : null;
  }
}
