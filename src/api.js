import axios from 'axios';

// Create a custom axios instance pointing to the Django backend
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/',
  timeout: 15000, // Forcibly terminate hung idle connections after 15 seconds so we can retry
});

// 1. Add the token to every outgoing request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Intercept responses: if it fails with a 401 (Expired Token), silently fetch a new one
api.interceptors.response.use(
  (response) => response, // If response is successful, just return it
  
  async (error) => {
    const originalRequest = error.config;

    // --- MAGIC: Render Cold Start Resilience ---
    // If the free Render server is asleep, it usually returns a Network Error (undefined response) or 502/504 Bad Gateway.
    // We automatically pause and retry the exact same request every 5 seconds until the server wakes up!
    if (!error.response || [502, 503, 504].includes(error.response.status)) {
        // Limit retries to 5 times (max 95 seconds), since Render usually boots in ~50 seconds.
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        
        if (originalRequest._retryCount <= 5) {
            console.warn(`Server is currently asleep. Waiting for it to wake up... (Retry ${originalRequest._retryCount}/5 in 5s)`);
            return new Promise((resolve) => {
                setTimeout(() => resolve(api(originalRequest)), 5000);
            });
        }
    }

    // If we got a 401 Unauthorized and we haven't already tried refreshing this specific request
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark that we are retrying so we don't end up in an infinite loop

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        // Ask Django for a new access token using the refresh token
        const response = await axios.post((process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/') + 'token/refresh/', {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        
        // Save the shiny new access token
        localStorage.setItem('access_token', newAccessToken);

        // Update the original failed request with the new active token, and try it again!
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // If the refresh token ITSELF is expired (e.g., after 7 days), force them to log in again
        console.error("Refresh token expired. User must log in again.");
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/'; 
        
        // Add a flag so the frontend components know NOT to show an error popup!
        refreshError.isSilentLogout = true;
        return Promise.reject(refreshError);
      }
    }

    // If it wasn't a 401 token error, just regular rejection
    return Promise.reject(error);
  }
);

export default api;
