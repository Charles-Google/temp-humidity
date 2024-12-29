import request from '../utils/request'
import type { DeviceThresholds } from '../types/device'

interface ThresholdData {
  temperature_threshold: {
    min: number
    max: number
  }
  humidity_threshold: {
    min: number
    max: number
  }
}

interface ThresholdsResponse {
  status: number
  message: string
  data: ThresholdData
}

export function fetchThresholds(data: { device_id: string }) {
  return request<ThresholdData>({
    url: '/thresholds',
    method: 'get',
    data,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export function updateThresholds(data: { device_id: string } & DeviceThresholds) {
  return request<ThresholdData>({
    url: '/thresholds',
    method: 'post',
    data: {
      device_id: data.device_id,
      temperature_threshold: data.temperature,
      humidity_threshold: data.humidity
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })
} 