export interface Device {
  id: string
  name: string
  type: string
  serialNumber: string
  password: string
}

export interface DeviceThresholds {
  temperature: {
    min: number
    max: number
  }
  humidity: {
    min: number
    max: number
  }
} 