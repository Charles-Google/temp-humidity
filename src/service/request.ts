import axios from 'axios';

const instance = axios.create({
  baseURL: '/api',  // 使用代理前缀
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 简化请求拦截器
instance.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
);

export default instance; 