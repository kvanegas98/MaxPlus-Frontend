import { apiGet } from '../lib/api';

export const portalService = {
  lookup: (customerId, token) => apiGet(`/api/portal/lookup?customerId=${customerId}`, token),
};
