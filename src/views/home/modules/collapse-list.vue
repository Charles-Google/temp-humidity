<script setup lang="ts">
import { ref, PropType, watch, nextTick, computed } from 'vue';
import { 
  InfoFilled,
  Sunny,          // 温度图标
  Cloudy          // 湿度图标
} from '@element-plus/icons-vue';
import LineChart from './line-chart.vue';
import { ElMessage } from 'element-plus';
import LogTable from './log-table.vue';
import { useAuthStore } from '@/store/modules/auth';

interface Device {
  id: number;
  name: string;
  type: string;
  serialNumber: string;
  password: string;
  temperature: number[];
  humidity: number[];
}

const props = defineProps({
  deviceList: {
    type: Array as PropType<Device[]>,
    required: true,
    default: () => [] // 添加默认值
  }
});

const authStore = useAuthStore();

// 添加权限检查
const isAdmin = computed(() => authStore.userInfo.userName?.toLowerCase() === 'admin');

// 当前活动面板
const activePanel = ref<number | null>(null);
const thresholds = ref({});

// 添加设置阈值的对话框控制
const thresholdDialogVisible = ref(false);
const currentDeviceId = ref<number | null>(null);
const thresholdForm = ref({
  temperature: {
    min: 0,
    max: 100
  },
  humidity: {
    min: 0,
    max: 100
  }
});

// 添加编辑对话框控制
const editDialogVisible = ref(false);
const editForm = ref({
  id: '',
  name: '',
  type: '',
  serialNumber: '',
  password: ''
});

// 添加 loading 状态控制
const deletingIds = ref<Set<number>>(new Set());

// 添加视图切换控制
const showChart = ref(true);
const logTableRefs = ref(new Map());

// 监听 deviceList 变化
watch(() => props.deviceList, (newList) => {
  console.log('Device list updated:', newList);
}, { immediate: true });

// 监听视图切换
watch(showChart, async (newVal) => {
  if (!newVal && activePanel.value !== null) {
    // 切换到日志视图时，等待下一个 tick 后触发查询
    await nextTick();
    const logTableRef = logTableRefs.value.get(activePanel.value);
    if (logTableRef) {
      logTableRef.setDefaultTimeRange();
    }
  }
});

// 监听 activePanel 的变化
watch(activePanel, async (newVal, oldVal) => {
  if (newVal !== null) {
    await fetchThresholds(newVal);
    // 如果当前是日志视图，需要触发日志查询
    if (!showChart.value) {
      await nextTick();
      const logTableRef = logTableRefs.value.get(newVal);
      if (logTableRef) {
        logTableRef.fetchLogs();
      }
    }
    // 使用 setTimeout 等待面板完全展开
    setTimeout(() => {
      // 直接使用 CSS 选择器查找当前激活的面板
      const panel = document.querySelector(`.el-collapse-item[data-name="${newVal}"]`);
      if (panel) {
        // 计算滚动位置
        const headerHeight = 60;
        const windowHeight = window.innerHeight;
        const panelTop = panel.getBoundingClientRect().top;
        const scrollTop = window.pageYOffset;
        
        // 计算理想的滚动位置（将面板放在视窗上方 20% 的位置）
        const targetScroll = scrollTop + panelTop - (windowHeight * 0.2);
        
        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }, 300);
  }
});

// 获取阈值
const fetchThresholds = async (deviceId) => {
  try {
    const response = await fetch('/biz/getthresholds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: deviceId
      })
    });

    const data = await response.json();
    console.log('获取阈值数据:', data);
    
    if (data.status === 1 && data.data) {
      // 转换数据格式以匹配line-chart组件的需求
      thresholds.value[deviceId] = {
        temperature: {
          min: data.data.temperature_threshold.min,
          max: data.data.temperature_threshold.max
        },
        humidity: {
          min: data.data.humidity_threshold.min,
          max: data.data.humidity_threshold.max
        }
      };
    }
  } catch (error) {
    console.error('获取阈值失败:', error);
  }
};

// 打开设置阈值对话框
const openThresholdDialog = (deviceId: number) => {
  currentDeviceId.value = deviceId;
  if (thresholds.value[deviceId]) {
    thresholdForm.value = JSON.parse(JSON.stringify(thresholds.value[deviceId]));
  }
  thresholdDialogVisible.value = true;
};

// 设置阈值
const setThresholds = async () => {
  if (!currentDeviceId.value) return;
  
  try {
    console.log('Setting thresholds:', {
      device_id: currentDeviceId.value,
      thresholds: thresholdForm.value
    });

    const response = await fetch('/device/thresholds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: String(currentDeviceId.value),
        temperature_threshold: {
          min: thresholdForm.value.temperature.min,
          max: thresholdForm.value.temperature.max
        },
        humidity_threshold: {
          min: thresholdForm.value.humidity.min,
          max: thresholdForm.value.humidity.max
        }
      })
    });

    const data = await response.json();
    console.log('Thresholds response:', data);

    if (data.status === 1) {
      ElMessage.success({
        message: '阈值设置成功',
        type: 'success'
      });
      thresholds.value[currentDeviceId.value] = JSON.parse(JSON.stringify(thresholdForm.value));
      thresholdDialogVisible.value = false;
    } else {
      ElMessage.error(data.message || '阈值设置失败');
    }
  } catch (error) {
    console.error('设置阈值失败:', error);
    ElMessage.error('设置阈值失败');
  }
};

// 打开编辑对话框
const handleEdit = (deviceId: number) => {
  const device = props.deviceList.find(d => d.id === deviceId);
  if (device) {
    editForm.value = {
      id: String(device.id),
      name: device.name,
      type: device.type,
      serialNumber: device.serialNumber,
      password: device.password
    };
    editDialogVisible.value = true;
  }
};

// 更新设备信息
const updateDevice = async () => {
  try {
    console.log('Updating device:', editForm.value);
    const response = await fetch('/device/devices', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        id: editForm.value.id,
        name: editForm.value.name,
        type: editForm.value.type,
        sn: editForm.value.serialNumber,
        passwd: editForm.value.password
      }])
    });

    const data = await response.json();
    console.log('Update response:', data);
    
    if (data.status === 1) {
      ElMessage.success({
        message: '设备更新成功',
        type: 'success'
      });
      editDialogVisible.value = false;
      await emit('refreshDevices');
    } else {
      ElMessage.error(data.message || '设备更新失败');
    }
  } catch (error) {
    console.error('更新设备失败:', error);
    ElMessage.error('更新设备失败');
  }
};

// 修改删除设备的函数
const handleDelete = async (deviceId: number) => {
  try {
    deletingIds.value.add(deviceId);  // 开始删除，添加到 loading 集合
    console.log('Deleting device:', deviceId);
    
    const response = await fetch('/device/devices', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ids: [String(deviceId)]
      })
    });

    const data = await response.json();
    console.log('Delete response:', data);
    
    if (data.status === 1) {
      ElMessage.success({
        message: '设备删除成功',
        type: 'success'
      });
      emit('refreshDevices');
    } else {
      ElMessage.error(data.message || '设备删除失败');
    }
  } catch (error) {
    console.error('删除设备失败:', error);
    ElMessage.error('删除设备失败');
  } finally {
    deletingIds.value.delete(deviceId);  // 无论成功失败，都移除 loading 状态
  }
};

// 修改 emit 定义
const emit = defineEmits(['refreshDevices']);

// 添加设置 ref 的方法
const setLogTableRef = (deviceId: number, el: any) => {
  if (el) {
    logTableRefs.value.set(deviceId, el);
  } else {
    logTableRefs.value.delete(deviceId);
  }
};
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <div class="demo-collapse">
      <el-skeleton :loading="!props.deviceList" animated>
        <template #template>
          <div class="device-skeleton">
            <!-- 表头骨架 -->
            <div class="device-header-skeleton">
              <el-skeleton-item variant="text" style="width: 15%" />
              <el-skeleton-item variant="text" style="width: 15%" />
              <el-skeleton-item variant="text" style="width: 15%" />
              <el-skeleton-item variant="text" style="width: 15%" />
              <el-skeleton-item variant="text" style="width: 15%" />
              <el-skeleton-item variant="text" style="width: 20%" />
            </div>
            <!-- 设备列表骨架 -->
            <div v-for="i in 3" :key="i" class="device-item-skeleton">
              <el-skeleton-item variant="text" style="width: 15%" />
              <el-skeleton-item variant="text" style="width: 15%" />
              <el-skeleton-item variant="text" style="width: 15%" />
              <el-skeleton-item variant="text" style="width: 15%" />
              <el-skeleton-item variant="text" style="width: 15%" />
              <div style="width: 20%; display: flex; gap: 8px;">
                <el-skeleton-item variant="button" style="width: 60px" />
                <el-skeleton-item variant="button" style="width: 60px" />
                <el-skeleton-item variant="button" style="width: 60px" />
              </div>
            </div>
          </div>
        </template>
        <template #default>
          <div class="device-info flex justify-between items-center mb-4">
            <span class="label text-center w-1/6">设备名称</span>
            <span class="label text-center w-1/6">设备类型</span>
            <span class="label text-center w-1/6">序列号</span>
            <span class="label text-center w-1/6">密码</span>
            <span class="label text-center w-1.7/6">操作</span>
          </div>
          <ElCollapse v-if="props.deviceList" v-model="activePanel" accordion>
            <ElCollapseItem 
              v-for="device in props.deviceList" 
              :key="device.id" 
              :name="device.id"
              :data-name="device.id"
            >
              <template #title>
                <div class="device-info flex justify-between items-center w-100%">
                  <div class="value text-center w-1/6">{{ device.name }}</div>
                  <div class="value text-center w-1/6">{{ device.type }}</div>
                  <div class="value text-center w-1/6">{{ device.serialNumber }}</div>
                  <div class="value text-center w-1/6">{{ device.password }}</div>
                  <div class="text-center w-1.7/6">
                    <ElButton type="primary" size="small" class="edit-btn" @click.stop="handleEdit(device.id)">编辑</ElButton>
                    <ElButton type="warning" size="small" class="edit-btn" @click.stop="openThresholdDialog(device.id)">设置阈值</ElButton>
                    <el-popconfirm 
                      title="确定要删除该设备吗？" 
                      @confirm="handleDelete(device.id)"
                      confirm-button-text="确定"
                      cancel-button-text="取消"
                      @click.stop
                    >
                      <template #reference>
                        <ElButton 
                          type="danger" 
                          size="small" 
                          class="edit-btn" 
                          @click.stop
                          :loading="deletingIds.has(device.id)"
                        >
                          {{ deletingIds.has(device.id) ? '删除中' : '删除' }}
                        </ElButton>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </template>
              <div>
                <div class="threshold-info">
                  
                  <div class="threshold-cards">
                    <!-- 温度阈值卡片 -->
                    <el-card class="threshold-card temperature">
                      <template #header>
                        <div class="card-header">
                          <el-icon class="header-icon">
                            <Sunny />
                          </el-icon>
                          <span>温度阈值</span>
                        </div>
                      </template>
                      <div class="threshold-values">
                        <div class="min-value">
                          <span class="label">最小值</span>
                          <span class="value">{{ thresholds[device.id]?.temperature?.min !== undefined ? `${thresholds[device.id]?.temperature?.min}°C` : '未设置' }}</span>
                        </div>
                        <div class="divider"></div>
                        <div class="max-value">
                          <span class="label">最大值</span>
                          <span class="value">{{ thresholds[device.id]?.temperature?.max !== undefined ? `${thresholds[device.id]?.temperature?.max}°C` : '未设置' }}</span>
                        </div>
                      </div>
                    </el-card>
                    
                    <!-- 湿度阈值卡片 -->
                    <el-card class="threshold-card humidity">
                      <template #header>
                        <div class="card-header">
                          <el-icon class="header-icon">
                            <Cloudy />
                          </el-icon>
                          <span>湿度阈值</span>
                        </div>
                      </template>
                      <div class="threshold-values">
                        <div class="min-value">
                          <span class="label">最小值</span>
                          <span class="value">{{ thresholds[device.id]?.humidity?.min !== undefined ? `${thresholds[device.id]?.humidity?.min}%` : '未设置' }}</span>
                        </div>
                        <div class="divider"></div>
                        <div class="max-value">
                          <span class="label">最大值</span>
                          <span class="value">{{ thresholds[device.id]?.humidity?.max !== undefined ? `${thresholds[device.id]?.humidity?.max}%` : '未设置' }}</span>
                        </div>
                      </div>
                    </el-card>
                  </div>
                </div>
                <div class="view-switch">
                    <el-switch
                      v-model="showChart"
                      class="ml-2 custom-switch"
                      style="--el-switch-on-color: #409EFF; --el-switch-off-color: #409EFF"
                      active-text="图表视图"
                      inactive-text="日志视图"
                      inline-prompt
                    />
                  </div>
                <div>
                  <LineChart 
                    v-if="showChart"
                    :device-id="String(device.id)"
                    :is-visible="showChart && activePanel === device.id"
                    :thresholds="thresholds[device.id]"
                  />
                  <LogTable
                    v-else
                    :ref="el => setLogTableRef(device.id, el)"
                    :device-id="device.id"
                    :is-visible="!showChart && activePanel === device.id"
                  />
                </div>
              </div>
            </ElCollapseItem>
          </ElCollapse>
          <div v-if="props.deviceList && props.deviceList.length === 0" class="text-center py-4">
            暂无设备数据
          </div>
        </template>
      </el-skeleton>
    </div>
  </NCard>

  <!-- 添加阈值设置对话框 -->
  <el-dialog
    v-model="thresholdDialogVisible"
    title="设置阈值"
    width="30rem"
    @keyup.enter="setThresholds"
  >
    <el-form :model="thresholdForm" label-width="100px">
      <el-form-item label="温度阈值">
        <el-input-number v-model="thresholdForm.temperature.min" :min="-50" :max="100" class="mr-2" />
        至
        <el-input-number v-model="thresholdForm.temperature.max" :min="-50" :max="100" class="ml-2" />
      </el-form-item>
      <el-form-item label="湿度阈值">
        <el-input-number v-model="thresholdForm.humidity.min" :min="0" :max="100" class="mr-2" />
        至
        <el-input-number v-model="thresholdForm.humidity.max" :min="0" :max="100" class="ml-2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="thresholdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="setThresholds">确认</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 添加编辑设备对话框 -->
  <el-dialog
    v-model="editDialogVisible"
    title="编辑设备"
    width="30rem"
    @keyup.enter="updateDevice"
  
  >
    <el-form :model="editForm" label-width="100px" :rules="{
      name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
      type: [{ required: true, message: '请输入设备类型', trigger: 'blur' }],
      serialNumber: [{ required: true, message: '请输入序列号', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    }">
      <el-form-item label="设备名称" prop="name">
        <el-input v-model="editForm.name" placeholder="请输入设备名称" />
      </el-form-item>
      <el-form-item label="设备类型" prop="type">
        <el-input v-model="editForm.type" placeholder="请输入设备类型" />
      </el-form-item>
      <el-form-item label="序列号" prop="serialNumber">
        <el-input v-model="editForm.serialNumber" placeholder="请输入序列号" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="editForm.password" placeholder="请输入密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateDevice">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.card-wrapper {
  margin: 16px;
}

.device-info {
  padding: 8px;
}

.label {
  font-weight: bold;
}

.value {
  padding: 4px;
}

.threshold-info {
  margin: 4px 0;
  padding: 4px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
}

.threshold-cards {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}

.threshold-card {
  flex: 1;
  min-width: 240px;
  transition: all 0.3s ease;
  box-shadow: none !important;
  background-color: var(--el-bg-color-overlay) !important;
  border-color: var(--el-border-color) !important;
}

.threshold-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 8px;
  color: var(--el-text-color-primary);
}

.threshold-values {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.min-value, .max-value {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: var(--el-border-color);
  margin: 0 8px;
}

.threshold-values .label {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.threshold-values .value {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.edit-btn {
  margin: 0 4px;
}

:deep(.el-card__header) {
  padding: 4px 8px;
}

:deep(.el-card__body) {
  padding: 4px 8px;
}

.header-icon {
  font-size: 16px;
}

.temperature .header-icon,
.temperature .value {
  color: #ff9800;  /* 温暖的橙色 */
}

.humidity .header-icon,
.humidity .value {
  color: #2196f3;  /* 清爽的蓝色 */
}

/* 去掉 el-card 的默认阴影 */
:deep(.el-card) {
  box-shadow: none !important;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color-overlay) !important;
}

/* 添加未设置状态的样式 */
.threshold-values .value.unset {
  color: var(--el-text-color-disabled);
  font-style: italic;
}

.view-switch {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px;
}

.switch-label {
  margin-right: 8px;
  color: #606266;
  font-size: 14px;
}

.custom-switch {
  --el-switch-core-width: 80px !important;  /* 增加开关宽度 */
  --el-switch-core-height: 28px !important; /* 增加开关高度 */
  transform: scale(1.1);  /* 整体放大1.1倍 */
}

/* 调整文字大小和位置 */
:deep(.custom-switch .el-switch__label) {
  font-size: 13px;
  line-height: 28px;
}

/* 设备列表骨架屏样式 */
.device-skeleton {
  padding: 16px;
}

.device-header-skeleton {
  display: flex;
  justify-content: space-between;
  padding: 16px 8px;
  margin-bottom: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.device-item-skeleton {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 8px;
  margin-bottom: 8px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

:deep(.el-skeleton__text) {
  height: 16px !important;
}

:deep(.el-skeleton__button) {
  height: 32px !important;
}
</style>