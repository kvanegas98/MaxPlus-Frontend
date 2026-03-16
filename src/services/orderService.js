import { apiGet, apiPost } from '../lib/api';

// Order: { id, customerName, customerPhone, customerEmail, tipoServicioId, notes, status, serviceName, createdAt }
// status: 'Pending' | 'Approved' | 'Rejected'

export const orderService = {
  // Público (sin token)
  create: (data) => apiPost('/api/orders', data),

  // Admin (con token)
  getAll:  (status, token) => apiGet(`/api/orders${status ? `?status=${status}` : ''}`, token),
  approve: (id, data, token) => apiPost(`/api/orders/${id}/approve`, data, token),
  reject:  (id, data, token) => apiPost(`/api/orders/${id}/reject`, data, token),
};
