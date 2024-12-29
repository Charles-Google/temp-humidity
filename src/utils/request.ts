import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

interface Response<T = any> {
  status: number
  message: string
  data: T
}

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '/device', // 默认使用设备服务的基础URL
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在这里可以添加请求头等配置
    if (config.method === 'get' && config.data) {
      // 对于 GET 请求，将 data 转换为 JSON 字符串
      config.data = JSON.stringify(config.data)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<Response>) => {
    const res = response.data
    if (res.status !== 1) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data
  },
  (error) => {
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

const request = async <T = any>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const res = await service(config)
    return res as T
  } catch (error: any) {
    return Promise.reject(error)
  }
}

export default request 