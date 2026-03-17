import { apiGet } from '../lib/api';

export const publicService = {
  getSettings:     () => apiGet('/api/Settings/public'),
  getMenu:         () => apiGet('/api/ServiceTypes/catalogo'),
  getMenuAgrupado: () => apiGet('/api/ServiceTypes/catalogo/agrupado'),
};
