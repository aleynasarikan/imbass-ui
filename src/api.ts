import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5002/api',
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
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to get a new access token using the HttpOnly refresh token cookie
                const res = await axios.post('http://localhost:5002/api/auth/refresh', {}, {
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
