import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export const iptvAccountService = {
  getStats:   (token)                         => apiGet('/api/iptv-accounts/stats', token),
  getView:    (token, page = 1, pageSize = 10) => apiGet(`/api/iptv-accounts/view?page=${page}&pageSize=${pageSize}`, token),
  getAll:        (token)                         => apiGet('/api/iptv-accounts', token),
  getByService:  (tipoServicioId, token)         => apiGet(`/api/iptv-accounts/by-service/${tipoServicioId}`, token),
  getById:    (id, token)                     => apiGet(`/api/iptv-accounts/${id}`, token),
  create:     (data, token)                   => apiPost('/api/iptv-accounts', data, token),
  update:     (id, data, token)               => apiPut(`/api/iptv-accounts/${id}`, data, token),
  deactivate: (id, token)                     => apiDelete(`/api/iptv-accounts/${id}`, token),
  assign:     (id, data, token)               => apiPost(`/api/iptv-accounts/${id}/assign`, data, token),
};
