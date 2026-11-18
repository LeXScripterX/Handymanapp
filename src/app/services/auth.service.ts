import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
  User,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithCredential,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Observable, of, switchMap, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserRole = 'cliente' | 'handyman' | 'admin';

export interface AppUser {
  uid: string;
  email: string;
  nombre: string;
  telefono?: string;
  rol: UserRole;
  identidadVerificada?: boolean;
  disponible?: boolean;
  calificacion?: number;
  trabajosCompletados?: number;
  experienciaAnos?: number;
  gananciasHoy?: number;
  completadosHoy?: number;
  fotoUrl?: string;
  terminosAceptados?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private http: HttpClient = inject(HttpClient);

  // Observable con el usuario autenticado (o null) en tiempo real.
  currentUser$: Observable<User | null> = user(this.auth);

  // Observable con los datos completos del usuario desde Firestore/API (incluye el rol)
  currentUserProfile$: Observable<AppUser | null> = this.currentUser$.pipe(
    switchMap((u) => (u ? this.obtenerPerfil(u.uid) : of(null)))
  );

  async getIdToken(): Promise<string> {
    const u = this.auth.currentUser;
    if (!u) throw new Error('No hay sesión activa');
    return await u.getIdToken();
  }

  // ── REGISTRO TRADICIONAL (Email/Password) ──────────────────────────────────
  async registrar(
    email: string,
    password: string,
    nombre: string,
    rol: UserRole,
    telefono?: string
  ): Promise<void> {
    // 1. Crear credenciales en Firebase Auth
    const credenciales = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    const token = await credenciales.user.getIdToken();

    // 2. Registrar perfil en FastAPI (el backend usa el Admin SDK y evita problemas de reglas)
    try {
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/usuarios/registro`,
          {
            nombre,
            rol,
            telefono: telefono || null,
            terminosAceptados: true
          },
          { headers }
        )
      );
    } catch (apiError) {
      console.error('Error al registrar perfil en el backend:', apiError);
      // NOTA: Ya no hacemos fallback a setDoc directo para evitar el error de permisos.
      // Si el backend falla, es mejor avisar al usuario que reintente.
      throw apiError; 
    }
  }

  // ── LOGIN TRADICIONAL ──────────────────────────────────────────────────────
  async iniciarSesion(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  // ── LOGIN CON GOOGLE ───────────────────────────────────────────────────────
  async loginConGoogle(rolPorDefecto: UserRole = 'cliente'): Promise<AppUser> {
    let userCredential;
    if (Capacitor.isNativePlatform()) {
      // Flujo nativo para Android / Emulador (evita el bloqueo de popups)
      const result = await FirebaseAuthentication.signInWithGoogle();
      if (result.credential?.idToken) {
        const credential = GoogleAuthProvider.credential(result.credential.idToken);
        userCredential = await signInWithCredential(this.auth, credential);
      } else {
        throw new Error('No se pudo obtener el idToken de Google nativo');
      }
    } else {
      // Flujo para Web (PC)
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      userCredential = await signInWithPopup(this.auth, provider);
    }
    return await this.asegurarPerfilOAuth(userCredential.user, rolPorDefecto);
  }

  // ── LOGIN CON FACEBOOK ─────────────────────────────────────────────────────
  async loginConFacebook(rolPorDefecto: UserRole = 'cliente'): Promise<AppUser> {
    const provider = new FacebookAuthProvider();
    const credenciales = await signInWithPopup(this.auth, provider);
    return await this.asegurarPerfilOAuth(credenciales.user, rolPorDefecto);
  }

  // ── LÓGICA PARA ASEGURAR PERFIL (OAUTH) ────────────────────────────────────
  private async asegurarPerfilOAuth(u: User, rolPorDefecto: UserRole): Promise<AppUser> {
    // 1. Intentar obtener el perfil existente (usando el backend o Firestore)
    const perfilExistente = await this.obtenerPerfil(u.uid);
    if (perfilExistente) {
      return perfilExistente;
    }

    // 2. Si no existe, crearlo a través de FastAPI
    const nombre = (u.displayName && u.displayName.trim().length >= 2)
      ? u.displayName.trim()
      : (u.email ? u.email.split('@')[0] : 'Usuario');

    const rolSeguro = rolPorDefecto === 'admin' ? 'cliente' : rolPorDefecto;
    const token = await u.getIdToken();

    try {
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/usuarios/registro`,
          {
            nombre,
            rol: rolSeguro,
            telefono: u.phoneNumber || null,
            terminosAceptados: true,
            fotoUrl: u.photoURL || null,
          },
          { headers }
        )
      );
    } catch (apiError) {
      console.error('Error al crear perfil OAuth vía API:', apiError);
      throw apiError;
    }

    // 3. Obtener el perfil recién creado
    const perfilCreado = await this.obtenerPerfil(u.uid);
    if (perfilCreado) {
      return perfilCreado;
    }

    // 4. Fallback final en memoria (solo si el backend no responde o tarda)
    return {
      uid: u.uid,
      email: u.email || '',
      nombre,
      rol: rolSeguro,
      identidadVerificada: false,
      disponible: true,
      calificacion: 5.0,
      trabajosCompletados: 0,
      experienciaAnos: 0.0,
      fotoUrl: u.photoURL || undefined,
      terminosAceptados: true,
    };
  }

  // ── CERRAR SESIÓN ──────────────────────────────────────────────────────────
  async cerrarSesion(): Promise<void> {
    await signOut(this.auth);
  }

  async restablecerContrasena(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  // ── OBTENER PERFIL ─────────────────────────────────────────────────────────
  async obtenerPerfil(uid: string): Promise<AppUser | null> {
    // 1. Intentar obtener perfil desde FastAPI
    try {
      const token = await this.getIdToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      const perfilApi = await firstValueFrom(
        this.http.get<AppUser>(`${environment.apiUrl}/usuarios/perfil`, { headers })
      );
      if (perfilApi) return perfilApi;
    } catch (e) {
      console.log('Perfil no encontrado en API, revisando Firestore...', e);
    }

    // 2. Fallback: Leer directamente de Firestore
    try {
      const snap = await getDoc(doc(this.firestore, `users/${uid}`));
      return snap.exists() ? (snap.data() as AppUser) : null;
    } catch (fsError) {
      console.error('Error al leer Firestore:', fsError);
      return null;
    }
  }

  async obtenerToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    return user ? await user.getIdToken() : null;
  }

  async actualizarPerfilApi(datos: Partial<AppUser>): Promise<AppUser> {
    const token = await this.getIdToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return await firstValueFrom(
      this.http.put<AppUser>(`${environment.apiUrl}/usuarios/perfil`, datos, { headers })
    );
  }
}