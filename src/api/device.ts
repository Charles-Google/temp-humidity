import request from '@/utils/request'
import type { Device } from '@/types/device'

interface DeviceResponse {
  data: Device
  status: number
  message: string
}

export function updateDevice(data: Device) {
  return request<DeviceResponse>({
    url: '/devices',
    method: 'put',
    data: [data],
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export function deleteDevice(deviceId: string) {
  return request<DeviceResponse>({
    url: '/devices',
    method: 'delete',
    data: {
      ids: [deviceId]
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })
} 