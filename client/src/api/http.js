import axios from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/stores/authStore';

const http = axios.create({ baseURL: '/api', timeout: 15000 });

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status;
    const msg = err.response?.data?.message || '请求失败';
    if (status === 401) {
      useAuthStore.getState().logout();
      if (!location.pathname.startsWith('/login')) {
        message.warning('登录已过期，请重新登录');
        location.href = '/login';
      }
    } else {
      message.error(msg);
    }
    return Promise.reject(err);
  }
);

export default http;
