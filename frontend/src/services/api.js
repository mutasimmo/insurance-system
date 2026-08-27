import axios from 'axios';

// =============================================
// تحديد عنوان API حسب البيئة
// =============================================
const getApiBase = () => {
    // في بيئة الإنتاج (Vercel)
    if (process.env.NODE_ENV === 'production') {
        return process.env.REACT_APP_API_URL || 'https://insurance-system-9hzb.onrender.com/api';
    }
    // في بيئة التطوير المحلية
    return 'http://localhost:5000/api';
};

const API_BASE = getApiBase();
console.log(`🔗 API Base URL (${process.env.NODE_ENV || 'development'}):`, API_BASE);

// =============================================
// إنشاء عميل Axios
// =============================================
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000, // 30 ثانية
    withCredentials: true
});

// =============================================
// دوال مساعدة للمصادقة
// =============================================
export const tokenHelpers = {
    getToken: () => localStorage.getItem('token'),
    setToken: (token) => localStorage.setItem('token', token),
    removeToken: () => localStorage.removeItem('token'),
    isAuthenticated: () => !!localStorage.getItem('token'),
    getUser: () => {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch {
            return null;
        }
    }
};

// =============================================
// Interceptor: إضافة التوكن تلقائياً
// =============================================
api.interceptors.request.use(
    (config) => {
        const token = tokenHelpers.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('📤 Request:', config.method.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error.message);
        return Promise.reject(error);
    }
);

// =============================================
// Interceptor: معالجة الأخطاء وإعادة المحاولة
// =============================================
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

api.interceptors.response.use(
    (response) => {
        console.log('📥 Response:', response.status, response.config.url);
        return response;
    },
    async (error) => {
        const config = error.config;
        
        // تحسين رسائل الخطأ
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ انتهت المهلة - الخادم لا يستجيب');
        } else if (error.response) {
            console.error(`❌ خطأ ${error.response.status}:`, error.response.data?.message || error.message);
        } else if (error.request) {
            console.error('❌ لا يوجد رد من الخادم - تحقق من الاتصال');
        } else {
            console.error('❌ خطأ في الطلب:', error.message);
        }

        // معالجة 401 (انتهاء الجلسة)
        if (error.response?.status === 401) {
            tokenHelpers.removeToken();
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // إعادة المحاولة للطلبات الفاشلة (باستثناء 401)
        if (!config || config._retryCount >= MAX_RETRIES) {
            return Promise.reject(error);
        }
        
        config._retryCount = (config._retryCount || 0) + 1;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config._retryCount));
        
        console.log(`🔄 إعادة المحاولة ${config._retryCount}/${MAX_RETRIES}:`, config.url);
        return api(config);
    }
);

// =============================================
// خدمات المصادقة (Auth)
// =============================================
export const authService = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    register: (data) => api.post('/auth/register', data),
    verify: () => api.get('/auth/verify'),
    logout: () => {
        tokenHelpers.removeToken();
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
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