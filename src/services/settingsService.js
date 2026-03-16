import { apiGet, apiPut } from '../lib/api';

export const settingsService = {
  getSettings: (token) => apiGet('/api/Settings', token),
  updateSettings: (data, token) => apiPut('/api/Settings', data, token),
};
