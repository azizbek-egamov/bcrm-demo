import axios from 'axios';

// Dynamic API URL based on hostname
const getApiUrl = () => {
    const hostname = window.location.hostname;

    // Cloudflare tunnel domain
    if (hostname === 'drinks-por-valued-truly.trycloudflare.com') {
        return 'https://penny-female-eliminate-precipitation.trycloudflare.com/api';
    }

    // Local development
    return 'http://localhost:8000/api';
};

const API_URL = getApiUrl();

const api = axios.create({
    baseURL: API_URL,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    localStorage.setItem('accessToken', response.data.access);
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

                    return api(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
