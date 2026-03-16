import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export const subscriptionService = {
  getActive:      (token) => apiGet('/api/subscriptions/active', token),
  getByCustomer:  (customerId, token) => apiGet(`/api/subscriptions/customer/${customerId}`, token),
  create:         (data, token) => apiPost('/api/subscriptions', data, token),
  update:         (id, data, token) => apiPut(`/api/subscriptions/${id}`, data, token),
  cancel:         (id, token) => apiDelete(`/api/subscriptions/${id}`, token),
  assign:         (id, data, token) => apiPost(`/api/subscriptions/${id}/assign`, data, token),
  getUnassigned:  (token) => apiGet('/api/subscriptions/unassigned', token),
  renew:          (id, data, token) => apiPost(`/api/subscriptions/${id}/renew`, data, token),
};
