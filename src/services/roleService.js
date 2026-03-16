import { apiGet } from '../lib/api';

export const roleService = {
  getAll: (token) => apiGet('/api/Roles', token),
};
