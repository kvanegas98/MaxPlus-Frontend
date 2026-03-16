import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export const plataformasConfigService = {
  getAll:  (token)           => apiGet('/api/plataformas-config', token),
  getById: (id, token)       => apiGet(`/api/plataformas-config/${id}`, token),
  create:  (data, token)     => apiPost('/api/plataformas-config', data, token),
  update:  (id, data, token) => apiPut(`/api/plataformas-config/${id}`, data, token),
  remove:  (id, token)       => apiDelete(`/api/plataformas-config/${id}`, token),
};
