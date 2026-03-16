import { apiPost } from '../lib/api';

export const authService = {
  login: (data) => apiPost('/api/Auth/login', data),
  setup: (data) => apiPost('/api/Auth/setup', data),
};
