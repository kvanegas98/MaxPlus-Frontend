import { apiGet, apiPost } from '../lib/api';

export const demoService = {
  // Público
  request: (data) => apiPost('/api/Demo/request', data),
  verify:  (id, data) => apiPost(`/api/Demo/${id}/verify`, data),

  // Privado (Requiere Token)
  getAll:  (status, token) => apiGet(`/api/demo${status ? `?status=${status}` : ''}`, token),
  approve: (id, data, token) => apiPost(`/api/demo/${id}/approve`, data, token),
  reject:  (id, data, token) => apiPost(`/api/demo/${id}/reject`, data, token),
};
