import axios from 'axios';

export const TOKEN_KEY = 'quickcart_token';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/invalid token on a protected call logs the user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/register')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

// Turn any error into a message a customer can understand
export const getErrorMessage = (err) => {
  if (err?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (!err?.response) return 'Unable to connect to the server. Check your internet connection and try again.';
  const msg = err.response.data?.message;
  if (msg) return msg;
  if (err.response.status === 403) return 'You do not have permission to do that.';
  if (err.response.status === 404) return 'We could not find what you were looking for.';
  return 'Something went wrong. Please try again.';
};

export const unwrap = (promise) => promise.then((res) => res.data.data);

export default api;
