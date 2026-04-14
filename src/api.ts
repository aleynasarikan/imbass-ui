import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

let apiBaseURL = (process.env.REACT_APP_API_URL || '').trim();

if (!apiBaseURL) {
    // If no URL is provided, default to localhost for development
    apiBaseURL = 'http://localhost:5002/api';
} else {
    // Ensure the URL starts with http:// or https://
    if (!apiBaseURL.startsWith('http://') && !apiBaseURL.startsWith('https://')) {
        apiBaseURL = 'https://' + apiBaseURL;
    }
    
    // Ensure it ends with /api but remove trailing slash before check
    const normalized = apiBaseURL.endsWith('/') ? apiBaseURL.slice(0, -1) : apiBaseURL;
    if (!normalized.endsWith('/api')) {
        apiBaseURL = normalized + '/api';
    } else {
        apiBaseURL = normalized;
    }
}

const api = axios.create({
    baseURL: apiBaseURL,
    withCredentials: true // Important for sending/receiving cookies (refresh token)
});

// Request Interceptor: Attach Access Token if available
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized by trying to refresh the token
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't already retried this original request
        // Also skip if the request was for login, register or refresh itself
        const isAuthRequest = originalRequest.url?.includes('/auth/login') || 
                            originalRequest.url?.includes('/auth/register') ||
                            originalRequest.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
            originalRequest._retry = true;

            try {
                // Attempt to get a new access token using the HttpOnly refresh token cookie
                const res = await axios.post(`${apiBaseURL}/auth/refresh`, {}, {
                    withCredentials: true // Must send cookies
                });

                // Save new token
                localStorage.setItem('accessToken', res.data.accessToken);

                // Update the original request with new token and retry
                originalRequest.headers['Authorization'] = `Bearer ${res.data.accessToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                // If refresh fails, user must log in again. Clear state.
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/login'; // Or dispatch a logout event to your global state
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
