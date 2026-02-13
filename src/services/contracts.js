import api from './api';

export const contractService = {
    getAll: (params) => api.get('/contracts/', { params }),
    get: (id) => api.get(`/contracts/${id}/`),
    create: (data) => api.post('/contracts/', data),
    update: (id, data) => api.put(`/contracts/${id}/`, data),
    delete: (id) => api.delete(`/contracts/${id}/`),
    getPayments: (id) => api.get(`/contracts/${id}/payments/`),
    makePayment: (id, data) => api.post(`/contracts/${id}/make_payment/`, data),
    updateSchedule: (id, data) => api.post(`/contracts/${id}/update_schedule/`, data),
    updateMonths: (id, data) => api.post(`/contracts/${id}/update_months/`, data),
    autoDistribute: (id, data) => api.post(`/contracts/${id}/auto_distribute/`, data),
    adminAction: (id, data) => api.post(`/contracts/${id}/admin_payment/`, data),
    downloadPdf: (id) => api.get(`/contracts/${id}/download_pdf/`, { responseType: 'blob' }),
};
