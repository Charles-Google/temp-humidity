<script setup lang="ts">
import HeaderBanner from './modules/header-banner.vue';
import CollapseList from './modules/collapse-list.vue';
import { ref, onMounted } from 'vue';

interface Device {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  password: string;
  temperatureThreshold?: number;
  humidityThreshold?: number;
  temperature: number[];
  humidity: number[];
}

const deviceList = ref<Device[]>([]);

// 获取设备数据
const fetchDevices = async () => {
  try {
    const response = await fetch('/device/devices');
    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.status === 1) {
      deviceList.value = data.data.map((device: any) => ({
        id: Number(device.id),
        name: device.name,
        type: device.type,
        serialNumber: device.sn,
        password: device.passwd,
        temperature: [], // 初始化温度数据
        humidity: [] // 初始化湿度数据
      }));
      console.log('Processed device list:', deviceList.value);
    }
  } catch (error) {
    console.error('获取设备数据失败:', error);
  }
};

onMounted(() => {
  fetchDevices();
});
</script>

<template>
  <div class="home-container">
    <HeaderBanner :device-total="deviceList.length" @refreshDevices="fetchDevices" />
    <CollapseList :device-list="deviceList" @refreshDevices="fetchDevices" />
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
