<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useAuthStore } from '@/store/modules/auth';
import SunLogo from '@/components/common/sun-logo.vue';
defineOptions({
  name: 'HeaderBanner'
});

const appStore = useAppStore();
const authStore = useAuthStore();

const gap = computed(() => (appStore.isMobile ? 0 : 16));

// 添加设备总数属性
const props = defineProps({
  deviceTotal: {
    type: Number,
    required: true
  }
});

interface StatisticData {
  id: number;
  label: string;
  value: string | number;
}

const statisticData = computed<StatisticData[]>(() => [
  {
    id: 1,
    label: '设备总数',
    value: props.deviceTotal
  }
]);

const goEmail = () => {
  window.open('https://mail.qq.com', '_blank');
};
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <NGrid :x-gap="gap" :y-gap="16" responsive="screen" item-responsive>
      <NGi span="24 s:24 m:18">
        <div class="flex-y-center">
          <SunLogo class="mr-3 h-18 w-18" />
          <div class="welcome-text">
            <h1 class="text-2xl font-bold">欢迎回来, {{ authStore.userInfo.userName || '用户' }}<el-tag type="primary" class="ml-2">{{ authStore.userInfo.roles[0] || '普通用户' }}</el-tag></h1>
            <p class="text-gray-500 text-lg">当前设备总数: <span class="font-bold text-black">{{ props.deviceTotal }}</span>，正常运行中</p>
          </div>
        </div>
      </NGi>
      <NGi span="24 s:24 m:6">
        <NSpace :size="24" justify="end" align="center">
          <NStatistic v-for="item in statisticData" :key="item.id" class="whitespace-nowrap text-center" v-bind="item" />
          <!-- <div class="message-count">
            <div class="label">消息总数</div>
            <ElBadge :value="12" class="item">
              <ElTooltip content="报警信息" placement="bottom">
                <ElButton @click="goEmail"><EmailLogo class="mx--3 h-8 w-8" /></ElButton>
              </ElTooltip>
            </ElBadge>
          </div> -->
        </NSpace>
      </NGi>
    </NGrid>
  </NCard>
</template>

<style scoped>
.flex-y-center {
  display: flex;
  align-items: center;
}

.message-count {
  text-align: center;
}

.message-count .label {
  margin-bottom: 8px;
  font-size: var(--n-label-font-size);
  color: var(--n-label-text-color);
}
</style>
