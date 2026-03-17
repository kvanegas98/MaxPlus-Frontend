import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export const categoriasService = {
  getActivas: ()                  => apiGet('/api/categorias/activas'),
  getAll:     (token)             => apiGet('/api/categorias', token),
  create:     (data, token)       => apiPost('/api/categorias', data, token),
  update:     (id, data, token)   => apiPut(`/api/categorias/${id}`, data, token),
  remove:     (id, token)         => apiDelete(`/api/categorias/${id}`, token),
};
