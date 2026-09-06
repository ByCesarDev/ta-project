import axios from 'axios';
import { supabase } from './supabase.js';

const rawApiUrl = import.meta.env.VITE_API_URL;
if (import.meta.env.PROD && !rawApiUrl) {
  throw new Error(
    'Missing required environment variable in production: VITE_API_URL. Please configure it in your deployment environment.'
  );
}
const API_BASE_URL = rawApiUrl || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach Supabase JWT Bearer token
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
