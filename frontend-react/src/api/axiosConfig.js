import axios from 'axios';

// 1. Create the instance
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: `${baseURL}/api/v1`, // Appending your API version path
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. REQUEST INTERCEPTOR: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // Changed key to match Login.js logic
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR: Handle Token Refresh
api.interceptors.response.use(
  (response) => response, // Return success directly
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 AND we haven't tried refreshing yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried to avoid infinite loops

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            // No refresh token? Logout.
            throw new Error("No refresh token available");
        }

        // Call Backend to get new Access Token
        const response = await axios.post(`${baseURL}/api/v1/token/refresh/`, {
            refresh: refreshToken
        });

        // Backend usually returns: { "access": "new_access_token..." }
        const newAccessToken = response.data.access;

        // Save new token
        localStorage.setItem('accessToken', newAccessToken);

        // Update the header of the failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh failed (refresh token also expired) -> Logout User
        console.error("Session expired.", refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login'; 
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;