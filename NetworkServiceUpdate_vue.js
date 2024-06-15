import axios from 'axios';
import Vue from 'vue';
import Vuex from 'vuex';
import router from './router';
import { Alert } from 'bootstrap-vue';
import NetInfo from "@react-native-community/netinfo";

Vue.use(Vuex);

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
  _baseUrl: null,
  _cachedImage: {},

  async _getBaseUrl() {
    // _baseUrl = "http://127.0.0.1:8000/api";
    this._baseUrl = "https://jsonplaceholder.typicode.com";
    return this._baseUrl;
  },

  async sendToServer({ url, headers, body, params, callback, withoutHeader = false, method = 'POST', isFormData = false }) {
    await this._getBaseUrl();
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);

    if (!isConnected) {
      return { success: false, errType: 0, msg: AppString.noInternetConnection };
    }

    body = this._cleanObject(body);
    params = this._cleanObject(params);

    console.log("Request body:", JSON.stringify(body));
    console.log("Request params:", JSON.stringify(params));

    try {
      const options = {
        headers: withoutHeader ? null : (headers ?? this._header(isFormData)),
        params,
      };

      const response = await this._executeRequest({ url, body, options, method, isFormData });

      console.log("Response:", JSON.stringify(response.data), "(Status code:", response.status, ")");

      if (response.status >= 200 && response.status < 300) {
        if (response.status === 201) {
          console.log("Resource created at:", response.headers.location);
        }
        return { success: true, statusCode: response.status, data: callback ? callback(response.data) : response.data };
      } else {
        return { success: false, statusCode: response.status, msg: this._handleError(response.status, response.data) };
      }
    } catch (error) {
      return this._handleAxiosError(error);
    }
  },

  _cleanObject(obj) {
    return obj ? Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null && v !== "")) : {};
  },

  _header(isFormData) {
    return {
      "Accept": "application/json",
      "Content-Type": isFormData ? "application/x-www-form-urlencoded" : "application/json",
      "lang": "en", // يمكنك تغيير اللغة حسب الحاجة
    };
  },

  async _executeRequest({ url, body, options, method, isFormData }) {
    const requestUrl = url.startsWith("http") ? url : `${this._baseUrl}/${url}`;
    switch (method) {
      case 'POST':
        return await axios.post(requestUrl, isFormData ? this._prepareRequestBody(body) : body, options);
      case 'GET':
        return await axios.get(requestUrl, options);
      case 'PUT':
        return await axios.put(requestUrl, body, options);
      case 'DELETE':
        return await axios.delete(requestUrl, options);
      default:
        throw new Error('Unsupported method: ' + method);
    }
  },

  _prepareRequestBody(body) {
    const formData = new FormData();
    for (const key in body) {
      formData.append(key, body[key]);
    }
    return formData;
  },

  _handleError(statusCode, error) {
    switch (statusCode) {
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

  _handleAxiosError(error) {
    console.log("Error Response:", error.response?.data);
    console.log("Error Response Status Code:", error.response?.status);

    let errorMessage;
    let errorType;

    if (error.code === 'ECONNABORTED') {
      errorMessage = AppString.connectionTimeout;
      errorType = 0;
    } else if (error.response) {
      errorMessage = this._handleError(error.response.status, error.response.data);
      errorType = 1;
    } else if (error.message === 'Network Error') {
      errorMessage = AppString.noInternetConnection;
      errorType = 0;
    } else {
      errorMessage = AppString.unexpectedError;
      errorType = 2;
    }

    return { success: false, errType: errorType, msg: errorMessage, statusCode: error.response?.status || 0, response: error.response };
  },

  async downloadFile({ url, savePath, headers }) {
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);

    if (!isConnected) {
      return { success: false, errType: 0, msg: AppString.noInternetConnection };
    }

    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'blob', // مهم لتحميل الملفات
        headers: headers ?? this._header(false),
      });

      const blob = new Blob([response.data], { type: response.data.type });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = savePath;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("Response: (Status code:", response.status, ")");

      if (response.status >= 200 && response.status < 300) {
        return { success: true, statusCode: response.status };
      } else {
        return { success: false, statusCode: response.status, msg: this._handleError(response.status, response.data) };
      }
    } catch (error) {
      return this._handleAxiosError(error);
    }
  }
};

export default NetworkServiceUpdate;
