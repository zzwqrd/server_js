class AppString {
    static noInternetConnection = 'No internet connection';
    static connectionTimeout = 'Connection timeout';
    static sendTimeout = 'Send timeout';
    static receiveTimeout = 'Receive timeout';
    static resourceNotFound = 'Resource not found: 404';
    static internalServerError = 'Internal server error: 500';
    static requestCancelled = 'Request cancelled';
    static unexpectedError = 'Unexpected error';
    static unknownError = 'Unknown error';
  
    static badRequest = 'Bad request';
    static unauthorized = 'Unauthorized';
    static forbidden = 'Forbidden';
    static notFound = 'Not found';
    static duplicateEmail = 'Duplicate email';
    static badGateway = 'Bad gateway';
    static unsupportedMediaType = 'Unsupported Media Type: 415';
    static resourceCreated = 'Resource successfully created: 201';
  }
  
  class NetworkServiceUpdate {
    constructor() {
      this._baseUrl = null;
      this._axiosInstance = axios.create();
      this.addInterceptors();
    }
  
    addInterceptors() {
      this._axiosInstance.interceptors.request.use(
        (config) => {
          LoggerDebug.cyan(`Request Parameters Data: ${JSON.stringify(config.params)}`);
          LoggerDebug.yellow(`Request Headers: ${JSON.stringify(config.headers)}`);
          LoggerDebug.green(`Request Path: ${config.method.toUpperCase()} ${config.url}`);
          return config;
        },
        (error) => {
          LoggerDebug.red(`Request Error: ${error}`);
          return Promise.reject(error);
        }
      );
  
      this._axiosInstance.interceptors.response.use(
        (response) => {
          LoggerDebug.green(`Response: ${JSON.stringify(response.data)} (Status code: ${response.status})`);
          return response;
        },
        (error) => {
          LoggerDebug.red(`Error Response: ${error.response?.data}`);
          return Promise.reject(error);
        }
      );
    }
  
    async sendToServer({ url, headers, body, params, callback, withoutHeader = false, method = 'POST', isFormData = false }) {
      await this._getBaseUrl();
  
      if (!navigator.onLine) {
        return {
          success: false,
          errType: 0,
          msg: AppString.noInternetConnection,
        };
      }
  
      if (body) {
        Object.keys(body).forEach(key => {
          if (body[key] == null || body[key] === '') delete body[key];
        });
      }
  
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] == null || params[key] === '') delete params[key];
        });
      }
  
      LoggerDebug.white(`Request body: ${JSON.stringify(body)}`);
      LoggerDebug.white(`Request params: ${JSON.stringify(params)}`);
  
      try {
        const options = {
          headers: withoutHeader ? {} : { ...this._header(), ...headers },
          params: params,
        };
  
        const requestUrl = url.startsWith('http') ? url : `${this._baseUrl}/${url}`;
        let response;
  
        if (method === 'POST') {
          response = await this._axiosInstance.post(requestUrl, body, options);
        } else if (method === 'GET') {
          response = await this._axiosInstance.get(requestUrl, options);
        } else if (method === 'PUT') {
          response = await this._axiosInstance.put(requestUrl, body, options);
        } else if (method === 'DELETE') {
          response = await this._axiosInstance.delete(requestUrl, options);
        } else {
          throw new Error(`Unsupported method: ${method}`);
        }
  
        LoggerDebug.green(`Response: ${JSON.stringify(response.data)} (Status code: ${response.status})`);
  
        if (response.status >= 200 && response.status < 300) {
          return {
            success: true,
            statusCode: response.status,
            data: callback ? callback(response.data) : response.data,
          };
        } else {
          return {
            success: false,
            statusCode: response.status,
            msg: this._handleError(response.status, response.data),
          };
        }
      } catch (error) {
        return this._handleAxiosError(error);
      }
    }
  
    _header() {
      return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'lang': this._getLang(),
      };
    }
  
    _getLang() {
      // Implement your logic to get the language
      return 'en';
    }
  
    async _getBaseUrl() {
      this._baseUrl = 'https://jsonplaceholder.typicode.com';
      const url = 'https://firebaseio.com/base_url.json';
      try {
        if (this._baseUrl) return this._baseUrl;
        const response = await axios.get(url, { headers: { 'Accept': 'application/json' } });
        if (response.data) {
          this._baseUrl = response.data;
          LoggerDebug.red(`Base URL: ${this._baseUrl}`);
          return this._baseUrl;
        } else {
          throw new Error('Unable to fetch base URL');
        }
      } catch (error) {
        throw new Error('Error fetching base URL');
      }
    }
  
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
    }
  
    _handleAxiosError(error) {
      LoggerDebug.red(`Error Response: ${error.response?.data}`);
      LoggerDebug.red(`Error Response: ${error.response?.status}`);
  
      let errorMessage;
      let errorType;
  
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        errorMessage = AppString.connectionTimeout;
        errorType = 0;
      } else if (error.message.includes('Network Error')) {
        errorMessage = AppString.noInternetConnection;
        errorType = 0;
      } else if (error.response) {
        errorMessage = this._handleError(error.response.status, error.response.data);
        errorType = 1;
      } else {
        errorMessage = AppString.unknownError;
        errorType = 2;
      }
  
      return {
        success: false,
        errType: errorType,
        msg: errorMessage,
        statusCode: error.response ? error.response.status : 0,
        response: error.response,
      };
    }
  
    async downloadFile({ url, savePath, headers }) {
      if (!navigator.onLine) {
        return {
          success: false,
          errType: 0,
          msg: AppString.noInternetConnection,
        };
      }
  
      try {
        const response = await this._axiosInstance.get(url, {
          headers: headers || this._header(),
          responseType: 'blob',
        });
  
        LoggerDebug.green(`Response: (Status code: ${response.status})`);
  
        if (response.status >= 200 && response.status < 300) {
          // Logic to save file to savePath
          return {
            success: true,
            statusCode: response.status,
          };
        } else {
          return {
            success: false,
            statusCode: response.status,
            msg: this._handleError(response.status, response.data),
          };
        }
      } catch (error) {
        return this._handleAxiosError(error);
      }
    }
  }
  
  class LoggerDebug {
    static white(message) {
      console.log(`%c${message}`, 'color: white');
    }
  
    static red(message) {
      console.log(`%c${message}`, 'color: red');
    }
  
    static green(message) {
      console.log(`%c${message}`, 'color: green');
    }
  
    static yellow(message) {
      console.log(`%c${message}`, 'color: yellow');
    }
  
    static cyan(message) {
      console.log(`%c${message}`, 'color: cyan');
    }
  }
  
// this use in ajex
//   // Import the NetworkServiceUpdate class
// import NetworkServiceUpdate from './networkService';

// // Initialize the network service instance
// const networkService = new NetworkServiceUpdate();

// // Example usage of sendToServer method
// async function exampleSendRequest() {
//   const response = await networkService.sendToServer({
//     url: '/posts',
//     method: 'GET',
//   });

//   if (response.success) {
//     console.log('Data:', response.data);
//   } else {
//     console.error('Error:', response.msg);
//   }
// }

// exampleSendRequest();

// // Example usage of downloadFile method
// async function exampleDownloadFile() {
//   const response = await networkService.downloadFile({
//     url: 'https://example.com/file.pdf',
//     savePath: '/path/to/save/file.pdf',
//   });

//   if (response.success) {
//     console.log('File downloaded successfully');
//   } else {
//     console.error('Error:', response.msg);
//   }
// }

// exampleDownloadFile();


// async function examplePostRequest() {
//     const networkService = new NetworkServiceUpdate();
  
//     const response = await networkService.sendToServer({
//       url: '/posts',
//       method: 'POST',
//       body: {
//         title: 'foo',
//         body: 'bar',
//         userId: 1,
//       },
//       callback: (data) => data,  // Process the response data if needed
//     });
  
//     if (response.success) {
//       console.log('Data:', response.data);
//     } else {
//       console.error('Error:', response.msg);
//     }
//   }