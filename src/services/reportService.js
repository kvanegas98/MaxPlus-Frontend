import { apiGet, apiDelete, apiGetBlob } from '../lib/api';

function buildQS(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const reportService = {
  // KPIs — filter: 'Hoy' | 'Semana'
  getSummary:      (filter = 'Hoy', token) =>
    apiGet(`/api/reports/summary?filter=${filter}`, token),

  // Gráfica barras por hora
  getSalesByHour:  (token) =>
    apiGet('/api/reports/sales-by-hour', token),

  // Top productos — filter: 'Hoy' | 'Semana'
  getTopProducts:  (filter = 'Hoy', top = 5, token) =>
    apiGet(`/api/reports/top-products?filter=${filter}&top=${top}`, token),

  // Anular factura
  voidOrder: (id, reason, token) =>
    apiDelete(`/api/reports/order-history/${id}`, { reason }, token),

  // Detalle de factura
  getInvoiceDetail: (invoiceId, token) =>
    apiGet(`/api/reports/invoices/${invoiceId}`, token),

  // Descargar PDF de factura → { blob, filename }
  downloadInvoicePdf: (invoiceId, token) =>
    apiGetBlob(`/api/reports/invoices/${invoiceId}/pdf`, token),

  // Descargar PNG de factura → { blob, filename }
  downloadInvoicePng: (invoiceId, token) =>
    apiGetBlob(`/api/reports/invoices/${invoiceId}/png`, token),

  // Historial paginado de facturas
  getOrderHistory: (params = {}, token) =>
    apiGet(`/api/reports/order-history${buildQS({
      startDate:    params.startDate,
      endDate:      params.endDate,
      pageNumber:   params.pageNumber ?? 1,
      pageSize:     params.pageSize  ?? 10,
      customerName: params.customerName,
      orderNumber:  params.orderNumber,
    })}`, token),

  // Resumen financiero (mes actual por defecto)
  getDashboardSummary: (params = {}, token) =>
    apiGet(`/api/dashboard/summary${buildQS({
      fechaDesde: params.fechaDesde,
      fechaHasta: params.fechaHasta,
    })}`, token),

  // Suscripciones por vencer
  getExpiring: (days = 7, token) =>
    apiGet(`/api/dashboard/expiring?days=${days}`, token),
};
