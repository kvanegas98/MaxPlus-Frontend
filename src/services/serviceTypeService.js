import { apiGet, apiPost, apiPut, apiDelete, apiPostMultipart } from '../lib/api';

// ServiceType: { id, name, description, price, purchasePrice, durationDays, category, imageUrl, isActive }
// category: 'Paid' | 'Demo'

export const serviceTypeService = {
  getAll:      (token)           => apiGet('/api/ServiceTypes', token),
  getById:     (id, token)       => apiGet(`/api/ServiceTypes/${id}`, token),
  create:      (data, token)     => apiPost('/api/ServiceTypes', data, token),
  update:      (id, data, token) => apiPut(`/api/ServiceTypes/${id}`, data, token),
  remove:      (id, token)       => apiDelete(`/api/ServiceTypes/${id}`, token),

  // Subir imagen antes de crear/actualizar. Devuelve { imageUrl }
  uploadImage: (file, token) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiPostMultipart('/api/ServiceTypes/upload-image', fd, token);
  },

  getPlataformasConfig: (token) => apiGet('/api/ServiceTypes/plataformas-config', token),
};
