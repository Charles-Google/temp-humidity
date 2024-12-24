<script setup lang="ts">
import HeaderBanner from './modules/header-banner.vue';
import CollapseList from './modules/collapse-list.vue';
import { ref, onMounted } from 'vue';

interface Device {
  id: number;
  name: string;
  type: string;
  serialNumber: string;
  password: string;
  temperatureThreshold?: number;
  humidityThreshold?: number;
  temperature: number[];
  humidity: number[];
}

// 添加默认设备数据
const defaultDevice: Device = {
  id: 0,
  name: '默认设备',
  type: '未知',
  serialNumber: 'SN0000',
  password: '000000',
  temperatureThreshold: 0,
  humidityThreshold: 0,
  temperature: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  humidity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};

const deviceList = ref<Device[]>([defaultDevice]);

// 获取设备数据
const fetchDevices = async () => {
  try {
    const response = await fetch('/api/devices');
    const data = await response.json();
    if (data.code === 200) {
      deviceList.value = data.data.devices;
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
    <HeaderBanner :device-total="deviceList.length" />
    <CollapseList :device-list="deviceList" />
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
