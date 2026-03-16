import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export const paymentMethodService = {
  // Público — sin token para mostrar al cliente en el menú
  getAllPublic: () => apiGet('/api/payment-methods'),

  // Admin
  getAll:  (token)           => apiGet('/api/payment-methods', token),
  create:  (data, token)     => apiPost('/api/payment-methods', data, token),
  update:  (id, data, token) => apiPut(`/api/payment-methods/${id}`, data, token),
  remove:  (id, token)       => apiDelete(`/api/payment-methods/${id}`, token),
};
