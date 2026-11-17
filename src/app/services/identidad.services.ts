import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ResultadoRegistroRostro {
  ok: boolean;
  mensaje: string;
}

export interface ResultadoValidarRostro {
  coincide: boolean;
  distancia: number;
}

@Injectable({ providedIn: 'root' })
export class IdentidadService {
  private http: HttpClient = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Captura una foto usando la cámara nativa de Capacitor.
   * @param frontal Si es true, usa la cámara frontal (selfie). Si es false, usa la cámara trasera (documento).
   */
  async tomarFoto(frontal: boolean = false): Promise<{ blob: Blob; webPath: string }> {
    const image = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      direction: frontal ? CameraDirection.Front : CameraDirection.Rear,
      promptLabelHeader: frontal ? 'Toma tu selfie' : 'Foto de tu documento',
      promptLabelPhoto: 'Elegir de galería',
      promptLabelPicture: 'Tomar foto',
    });

    if (!image.webPath) {
      throw new Error('No se pudo obtener la imagen');
    }

    const response = await fetch(image.webPath);
    const blob = await response.blob();
    return { blob, webPath: image.webPath };
  }

  /**
   * Envía la selfie y la foto del documento al backend FastAPI para verificar rostro y generar embedding.
   */
  registrarRostro(selfieBlob: Blob, docBlob: Blob, token: string): Observable<ResultadoRegistroRostro> {
    const formData = new FormData();
    formData.append('selfie', selfieBlob, 'selfie.jpg');
    formData.append('documento', docBlob, 'documento.jpg');
    formData.append('consentimiento', 'true');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<ResultadoRegistroRostro>(
      `${this.apiUrl}/identidad/registrar-rostro`,
      formData,
      { headers }
    );
  }

  /**
   * Valida una nueva selfie contra el embedding guardado en Firestore.
   */
  validarRostro(selfieBlob: Blob, token: string): Observable<ResultadoValidarRostro> {
    const formData = new FormData();
    formData.append('selfie', selfieBlob, 'selfie.jpg');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<ResultadoValidarRostro>(
      `${this.apiUrl}/identidad/validar-rostro`,
      formData,
      { headers }
    );
  }

  /**
   * Solicita el borrado de datos biométricos (derecho de supresión GDPR).
   */
  borrarRostro(token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.delete(`${this.apiUrl}/identidad/rostro`, { headers });
  }
}