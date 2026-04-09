import { apiGet, apiPost } from '../lib/api';

export const invoiceService = {
  create:       (data, token)              => apiPost('/api/invoices', data, token),
  getById:      (id, token)               => apiGet(`/api/invoices/${id}`, token),
  getUnassigned:(tipoServicioId, token)   => apiGet(
    `/api/subscriptions/unassigned${tipoServicioId ? `?tipoServicioId=${tipoServicioId}` : ''}`,
    token,
  ),
};
