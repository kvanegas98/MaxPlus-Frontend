import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export const userService = {
  getAll:         (token)           => apiGet('/api/Users', token),
  getById:        (id, token)       => apiGet(`/api/Users/${id}`, token),
  create:         (data, token)     => apiPost('/api/Users', data, token),
  update:         (id, data, token) => apiPut(`/api/Users/${id}`, data, token),
  changePassword: (id, data, token) => apiPost(`/api/Users/${id}/change-password`, data, token),
  deactivate:     (id, token)       => apiDelete(`/api/Users/${id}`, token),
};
