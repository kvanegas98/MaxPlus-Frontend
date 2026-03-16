import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export const customerService = {
  getAll:  (token)           => apiGet('/api/Customers', token),
  getById: (id, token)       => apiGet(`/api/Customers/${id}`, token),
  search:  (term, token)     => apiGet(`/api/Customers/search?term=${encodeURIComponent(term)}`, token),
  create:  (data, token)     => apiPost('/api/Customers', data, token),
  update:  (id, data, token) => apiPut(`/api/Customers/${id}`, data, token),
  remove:  (id, token)       => apiDelete(`/api/Customers/${id}`, token),
};
