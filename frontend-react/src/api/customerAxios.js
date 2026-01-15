
import axios from 'axios';


const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const customerApi = axios.create({
    baseURL: `${baseURL}/api/v1`, // Appending your API version path
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- 1. REQUEST INTERCEPTOR (Attaches Token) ---
customerApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('customer_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// --- 2. RESPONSE INTERCEPTOR (Handles Refresh) ---
customerApi.interceptors.response.use(
    (response) => response, // Return successful responses as is
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 (Unauthorized) and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark as retried to avoid infinite loops

            const refreshToken = localStorage.getItem('customer_refresh');

            if (refreshToken) {
                try {
                    // Call the Refresh API
                    const res = await axios.post('http://127.0.0.1:8000/api/v1/customer/token/refresh/', {
                        refresh: refreshToken
                    });

                    // 1. Save the new Access Token
                    const newAccessToken = res.data.access;
                    localStorage.setItem('customer_token', newAccessToken);

                    // 2. Update the header for the original request
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    // 3. Retry the original request with the new token
                    return customerApi(originalRequest);

                } catch (refreshError) {
                    console.error("Session expired:", refreshError);
                    // Refresh failed (token expired/invalid) -> Logout
                    localStorage.removeItem('customer_token');
                    localStorage.removeItem('customer_refresh');
                    localStorage.removeItem('customer_name');
                    window.location.reload(); // Redirect/Reload to login
                }
            }
        }
        return Promise.reject(error);
    }
);

export default customerApi;