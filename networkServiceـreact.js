import axios from 'axios';
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

// تعريف الأخطاء الثابتة
const AppString = {
  noInternetConnection: 'No internet connection',
  connectionTimeout: 'Connection timeout',
  sendTimeout: 'Send timeout',
  receiveTimeout: 'Receive timeout',
  resourceNotFound: 'Resource not found: 404',
  internalServerError: 'Internal server error: 500',
  requestCancelled: 'Request cancelled',
  unexpectedError: 'Unexpected error',
  unknownError: 'Unknown error',
  badRequest: 'Bad request',
  unauthorized: 'Unauthorized',
  forbidden: 'Forbidden',
  notFound: 'Not found',
  duplicateEmail: 'Duplicate email',
  badGateway: 'Bad gateway',
  unsupportedMediaType: 'Unsupported Media Type: 415',
  resourceCreated: 'Resource successfully created: 201'
};

const NetworkServiceUpdate = {
  _baseUrl: 'https://jsonplaceholder.typicode.com',
  _cachedImage: {},

  handleError(error) {
    let errorMessage = '';
    if (error.response) {
      // The request was made and the server responded with a status code
      errorMessage = this.getServerErrorMessage(error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response received';
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message;
    }
    return Promise.reject(errorMessage);
  },

  getServerErrorMessage(status) {
    switch (status) {
      case 400:
        return AppString.badRequest;
      case 401:
        return AppString.unauthorized;
      case 403:
        return AppString.forbidden;
      case 404:
        return AppString.notFound;
      case 415:
        return AppString.unsupportedMediaType;
      case 422:
        return AppString.duplicateEmail;
      case 500:
        return AppString.internalServerError;
      case 502:
        return AppString.badGateway;
      default:
        return AppString.unknownError;
    }
  },

  getHttpOptions(isFormData = false) {
    return {
      headers: {
        'Content-Type': isFormData ? 'application/x-www-form-urlencoded' : 'application/json',
        'Accept': 'application/json',
        'lang': 'en' // يمكنك تغيير اللغة حسب الحاجة
      }
    };
  },

  async isConnected() {
    const state = await NetInfo.fetch();
    return state.isConnected;
  },

  async sendToServer({ url, method = 'POST', body = {}, isFormData = false }) {
    if (!(await this.isConnected())) {
      return Promise.reject(AppString.noInternetConnection);
    }

    const options = this.getHttpOptions(isFormData);
    const requestUrl = `${this._baseUrl}/${url}`;

    switch (method) {
      case 'POST':
        return axios.post(requestUrl, body, options).catch(this.handleError.bind(this));
      case 'GET':
        return axios.get(requestUrl, options).catch(this.handleError.bind(this));
      case 'PUT':
        return axios.put(requestUrl, body, options).catch(this.handleError.bind(this));
      case 'DELETE':
        return axios.delete(requestUrl, options).catch(this.handleError.bind(this));
      default:
        throw new Error('Unsupported request method');
    }
  },

  async downloadFile(url, savePath) {
    if (!(await this.isConnected())) {
      return Promise.reject(AppString.noInternetConnection);
    }

    return axios
      .get(`${this._baseUrl}/${url}`, {
        responseType: 'blob'
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', savePath);
        document.body.appendChild(link);
        link.click();
      })
      .catch(this.handleError.bind(this));
  }
};

export default NetworkServiceUpdate;
