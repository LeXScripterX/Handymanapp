import { Capacitor } from '@capacitor/core';

export const environment = {
  production: false,
  // Si detecta Android usa 10.0.2.2, si detecta Web usa localhost
  apiUrl: Capacitor.getPlatform() === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000',
  firebaseConfig: {
    apiKey: 'AIzaSyCRfqV0mLMAgYTV7dWBegDagvoKfZwStT4',
    authDomain: 'handyman-a3204.firebaseapp.com',
    projectId: 'handyman-a3204',
    storageBucket: 'handyman-a3204.firebasestorage.app',
    messagingSenderId: '165281406687',
    appId: '1:165281406687:web:5469add2e03f9d41fc136a',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
