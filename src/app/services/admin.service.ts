import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AppUser } from './auth.service';

export type EstadoAprobacion = 'pendiente' | 'aprobado' | 'rechazado';

/**
 * Usuario tal como lo ve el administrador.
 * Los campos `habilitado` y `estadoAprobacion` son opcionales porque los
 * usuarios creados antes del panel de admin no los tienen:
 *  - habilitado === undefined  -> se considera habilitado
 *  - estadoAprobacion undefined (solo handyman) -> se considera 'pendiente'
 */
export interface UsuarioAdmin extends AppUser {
  habilitado?: boolean;
  estadoAprobacion?: EstadoAprobacion;
}

/** Documento de la colección `servicios`. Ajusta los campos si tu equipo usa otros nombres. */
export interface ServicioAdmin {
  id: string;
  titulo?: string;
  cliente?: string;
  handyman?: string;
  estado?: string;
  precio?: number;
  fecha?: any;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private firestore = inject(Firestore);

  /** Todos los usuarios, en tiempo real. */
  usuarios$ = collectionData(
    collection(this.firestore, 'users')
  ) as unknown as Observable<UsuarioAdmin[]>;

  /** Todos los servicios / operaciones, en tiempo real. */
  servicios$ = collectionData(
    collection(this.firestore, 'servicios'),
    { idField: 'id' }
  ) as unknown as Observable<ServicioAdmin[]>;

  actualizarUsuario(uid: string, datos: Partial<UsuarioAdmin>): Promise<void> {
    return updateDoc(doc(this.firestore, `users/${uid}`), datos as any);
  }
}