import axios from 'axios';

// =============================================
// تحديد عنوان API (ثابت مباشر)
// =============================================
// ✅ استخدام الرابط الثابت مباشرة
const API_BASE = 'https://insurance-system-9hzb.onrender.com/api';

console.log('🔗 API Base URL:', API_BASE);

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
        console.log('📤 Request:', config.method.toUpperCase(), config.url);
        return config;
    },
    (error) => Promise.reject(error)
);

// التعامل مع أخطاء المصادقة
api.interceptors.response.use(
    (response) => {
        console.log('📥 Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('❌ API Error:', error.message);
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