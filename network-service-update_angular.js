import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { AlertController } from '@ionic/angular';
import { Network } from '@ionic-native/network/ngx';

@Injectable({
  providedIn: 'root'
})
export class NetworkServiceUpdateService {
  constructor(private http: HttpClient, private alertCtrl: AlertController, private network: Network) {
    this._baseUrl = 'https://jsonplaceholder.typicode.com';
  }

  handleError(error) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `An error occurred: ${error.error.message}`;
    } else {
      errorMessage = this.getServerErrorMessage(error.status);
    }
    return throwError(errorMessage);
  }

  getServerErrorMessage(status) {
    const AppString = {
      404: 'Not Found: 404',
      500: 'Internal Server Error: 500',
      403: 'Access Denied: 403',
      401: 'Unauthorized: 401',
      default: 'Unexpected Error'
    };
    return AppString[status] || AppString.default;
  }

  getHttpOptions(isFormData = false) {
    return {
      headers: new HttpHeaders({
        'Content-Type': isFormData ? 'application/x-www-form-urlencoded' : 'application/json',
        'Accept': 'application/json',
        'lang': 'en'
      })
    };
  }

  isConnected() {
    const connection = this.network.type !== 'none';
    if (!connection) {
      this.showAlert('No internet connection');
    }
    return connection;
  }

  showAlert(message) {
    this.alertCtrl.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    }).then(alert => alert.present());
  }

  sendToServer(url, method, body = null, isFormData = false) {
    if (!this.isConnected()) {
      return throwError('No internet connection');
    }

    const options = this.getHttpOptions(isFormData);
    const requestUrl = `${this._baseUrl}/${url}`;

    switch (method) {
      case 'POST':
        return this.http.post(requestUrl, body, options).pipe(
          retry(3),
          catchError(this.handleError.bind(this))
        );
      case 'GET':
        return this.http.get(requestUrl, options).pipe(
          retry(3),
          catchError(this.handleError.bind(this))
        );
      case 'PUT':
        return this.http.put(requestUrl, body, options).pipe(
          retry(3),
          catchError(this.handleError.bind(this))
        );
      case 'DELETE':
        return this.http.delete(requestUrl, options).pipe(
          retry(3),
          catchError(this.handleError.bind(this))
        );
      default:
        throw new Error('Unsupported request method');
    }
  }

  downloadFile(url, savePath) {
    if (!this.isConnected()) {
      return throwError('No internet connection');
    }

    return this.http.get(`${this._baseUrl}/${url}`, {
      responseType: 'blob'
    }).pipe(
      retry(3),
      catchError(this.handleError.bind(this))
    );
  }
}
