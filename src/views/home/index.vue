<script setup lang="ts">
import HeaderBanner from './modules/header-banner.vue';
import CollapseList from './modules/collapse-list.vue';
import { ref } from 'vue';

// 设备列表数据，从 CollapseList 组件提升到这里
const deviceList = ref([
  {
    id: 1,
    name: '温湿度设备',
    type: 'null',
    serialNumber: 'SNTAH',
    password: '123456'
  },
  {
    id: 2,
    name: '温度设备',
    type: '-',
    serialNumber: 'SNTBH',
    password: '654321'
  }
]);
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
