import axios from 'axios';

// =============================================
// تحديد عنوان API حسب البيئة
// =============================================
const getApiBase = () => {
    // في بيئة الإنتاج (Vercel)
    if (process.env.NODE_ENV === 'production') {
        // استبدل هذا بالرابط الفعلي لـ Render بعد النشر
        return 'https://insurance-backend.onrender.com/api';
    }
    // في بيئة التطوير المحلية
    return 'http://localhost:5000/api';
};

const API_BASE = getApiBase();

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

// إضافة التوكن تلقائياً لكل طلب
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// التعامل مع أخطاء المصادقة
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// =============================================
// خدمات المصادقة (Auth)
// =============================================
export const authService = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    register: (data) => api.post('/auth/register', data),
    verify: () => api.get('/auth/verify')
};

// =============================================
// خدمات العائلة (Family)
// =============================================
export const familyService = {
    getSponsors: () => api.get('/sponsors'),
    getSponsor: (id) => api.get(`/sponsors/${id}`),
    addSponsor: (data) => api.post('/sponsors', data),
    updateSponsor: (id, data) => api.put(`/sponsors/${id}`, data),
    deleteSponsor: (id) => api.delete(`/sponsors/${id}`),
    addDependent: (data) => api.post('/dependents', data),
    updateDependent: (id, data) => api.put(`/dependents/${id}`, data),
    deleteDependent: (id) => api.delete(`/dependents/${id}`),
    getDashboard: () => api.get('/dashboard')
};

export default api;