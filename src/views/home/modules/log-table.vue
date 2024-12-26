<template>
  <div class="log-table-container">
    <el-skeleton :loading="loading" animated :rows="6" :throttle="0">
      <template #template>
        <div class="skeleton-wrapper">
          <el-skeleton-item variant="input" style="width: 400px; height: 40px" class="mb-4"/>
          <el-skeleton-item variant="p" style="width: 100%; height: 300px"/>
        </div>
      </template>
      <template #default>
        <div class="table-header">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :default-time="[
              new Date(2000, 1, 1, 0, 0, 0),
              new Date(2000, 1, 1, 23, 59, 59)
            ]"
            @change="handleTimeChange"
          />
        </div>

        <el-table
          :data="logs"
          style="width: 100%"
          :header-cell-style="{ background: '#f5f7fa' }"
          border
        >
          <el-table-column prop="timestamp" label="时间" width="160" fixed>
            <template #default="{ row }">
              {{ formatDateTime(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column label="设备编号" width="140" fixed>
            <template #default="{ row }">
              {{ extractDeviceId(row.message) }}
            </template>
          </el-table-column>
          <el-table-column prop="log_level" label="级别" width="80" fixed>
            <template #default="{ row }">
              <el-tag
                :type="row.log_level === 'ERROR' ? 'danger' : 'warning'"
                effect="dark"
                size="small"
              >
                {{ row.log_level }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="当前温度" width="120">
            <template #default="{ row }">
              {{ extractTemperature(row.message) }}°C
            </template>
          </el-table-column>
          <el-table-column label="当前湿度" width="120">
            <template #default="{ row }">
              {{ extractHumidity(row.message) }}%
            </template>
          </el-table-column>
          <el-table-column label="温度阈值" width="160">
            <template #default="{ row }">
              {{ extractTempThreshold(row.message) }}
            </template>
          </el-table-column>
          <el-table-column label="湿度阈值" width="160">
            <template #default="{ row }">
              {{ extractHumidThreshold(row.message) }}
            </template>
          </el-table-column>
          <el-table-column label="告警原因" min-width="200">
            <template #default="{ row }">
              {{ extractAlertMessage(row.message) }}
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { DateModelType } from 'element-plus';
import dayjs from 'dayjs';

interface LogData {
  timestamp: string;
  log_level: string;
  message: string;
  alert_reason: string;
}

const props = defineProps<{
  deviceId: number;
  isVisible: boolean;
}>();

const loading = ref(false);
const logs = ref<LogData[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const timeRange = ref<DateModelType>([]);

const setDefaultTimeRange = () => {
  const today = dayjs();
  timeRange.value = [
    today.startOf('day').toDate(),
    today.endOf('day').toDate()
  ];
  fetchLogs();
};

const fetchLogs = async () => {
  loading.value = true;
  try {
    const [startTime, endTime] = timeRange.value || [];
    const response = await fetch('/log/query_by_device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: String(props.deviceId),
        start_time: startTime ? dayjs(startTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
        end_time: endTime ? dayjs(endTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
      }),
    });

    const data = await response.json();
    if (data.success) {
      logs.value = data.data;
      total.value = data.total;
    }
  } catch (error) {
    console.error('获取日志失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleTimeChange = () => {
  if (timeRange.value && timeRange.value.length === 2) {
    currentPage.value = 1;
    fetchLogs();
  }
};

const handleSizeChange = () => {
  currentPage.value = 1;
  fetchLogs();
};

const handleCurrentChange = () => {
  fetchLogs();
};

const formatDateTime = (timestamp: string) => {
  return dayjs(timestamp).format('MM-DD HH:mm:ss');
};

const formatMessage = (message: string) => {
  return message.replace(/\\n/g, '\n').replace(/\\"/g, '"');
};

const extractDeviceId = (message: string): string => {
  const match = message.match(/设备编号:(\d+)/);
  return match ? match[1] : '-';
};

const extractTemperature = (message: string): string => {
  const match = message.match(/设置温度:([\d.]+)°C/);
  return match ? match[1] : '-';
};

const extractHumidity = (message: string): string => {
  const match = message.match(/湿度:([\d.]+)%/);
  return match ? match[1] : '-';
};

const extractTempThreshold = (message: string): string => {
  const match = message.match(/温度阈值:([\d.]+)°C-([\d.]+)°C/);
  return match ? `${match[1]}°C - ${match[2]}°C` : '-';
};

const extractHumidThreshold = (message: string): string => {
  const match = message.match(/湿度阈值:([\d.]+)%-([\d.]+)%/);
  return match ? `${match[1]}% - ${match[2]}%` : '-';
};

const extractAlertMessage = (message: string): string => {
  const cleanMessage = message.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
  const match = cleanMessage.match(/设备编号:\d+的(.*?)(?=\s*设置温度|$)/);
  if (match) {
    return match[1].trim();
  }
  return cleanMessage;
};

// 暴露方法给父组件
defineExpose({
  setDefaultTimeRange,
  fetchLogs
});

// 移除 watch 和 onMounted 中的自动查询逻辑
watch(() => props.isVisible, (newVal) => {
}, { immediate: false });

onMounted(() => {
  // 只初始化时间范围，不触发查询
  if (!timeRange.value || timeRange.value.length === 0) {
    const today = dayjs();
    timeRange.value = [
      today.startOf('day').toDate(),
      today.endOf('day').toDate()
    ];
  }
});
</script>

<style scoped>
.log-table-container {
  padding: 16px;
  background-color: white;
  border-radius: 8px;
}

.table-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.message-content {
  white-space: pre-line;
  line-height: 1.5;
  padding: 8px;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table) {
  --el-table-border-color: #e4e7ed;
  --el-table-header-bg-color: #f5f7fa;
  --el-table-row-hover-bg-color: #f5f7fa;
}

:deep(.el-table__row) {
  transition: background-color 0.3s;
}

.skeleton-wrapper {
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
}

:deep(.el-skeleton__text) {
  height: 40px !important;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background: #dcdfe6;
  border-radius: 3px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background: #f5f7fa;
}

.message-pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
}

:deep(.el-table .cell) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.message-content,
.message-pre {
  display: none;
}

:deep(.el-table .cell.alert-reason) {
  white-space: normal;
  line-height: 1.5;
  padding: 8px 0;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
  max-height: calc(100vh - 300px);
}

:deep(.el-table .cell) {
  white-space: pre-wrap;
  line-height: 1.5;
}
</style>