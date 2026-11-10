/**
 * Centralized API configuration for Karthik-BikeGo
 * Reads base URL from VITE_API_URL environment variable with fallback to deployed Render backend.
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://bike-go-g08g.onrender.com'
).replace(/\/+$/, '');

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
    RESEND_OTP: `${API_BASE_URL}/api/auth/resend-otp`,
  },
  BIKES: {
    LIST: `${API_BASE_URL}/api/bikes`,
  },
  BOOKINGS: {
    CREATE: `${API_BASE_URL}/api/bookings`,
    USER_BOOKINGS: `${API_BASE_URL}/api/bookings`,
    CANCEL: (id) => `${API_BASE_URL}/api/bookings/${id}/cancel`,
  },
  HEALTH: `${API_BASE_URL}/api/health`,
};
