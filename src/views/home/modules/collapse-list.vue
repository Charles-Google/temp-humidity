<script setup lang="ts">
import { ref, PropType } from 'vue';
import { InfoFilled } from '@element-plus/icons-vue';
import LineChart from './line-chart.vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import HeaderBanner from './header-banner.vue';

// 定义数据
const temperatureData = [25.3, 26.1, 25.8, 26.4, 27.2, 26.8, 25.9, 25.4, 25.7, 26.2]; // 温度数据
const humidityData = [45, 48, 52, 49, 47, 51, 53, 50, 48, 46]; // 湿度数据

// 在 script setup 中修改 props 定义
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

const props = defineProps({
  deviceList: {
    type: Array as PropType<Device[]>,
    required: true
  }
});

// 当前活动面板
const activePanel = ref<string | string[]>('1');

console.log('Download data:', temperatureData); // 添加日志
console.log('Register data:', humidityData); // 添加日志

// 添加编辑表单的响应式数据
const editForm = ref({
  name: '',
  type: '',
  serialNumber: '',
  password: '',
  temperatureThreshold: undefined as number | undefined,
  humidityThreshold: undefined as number | undefined
});

// 控制对话框显示
const dialogVisible = ref(false);

// 当前编辑的设备ID
const currentEditId = ref<number | null>(null);

// 处理编辑按钮点击事件
const handleEdit = (deviceId: number) => {
  const device = props.deviceList.find(d => d.id === deviceId);
  if (!device) return;
  
  // 设置当前编辑的设备数据（不包括温湿度数据）
  currentEditId.value = deviceId;
  editForm.value = {
    name: device.name,
    type: device.type,
    serialNumber: device.serialNumber,
    password: device.password,
    temperatureThreshold: device.temperatureThreshold,
    humidityThreshold: device.humidityThreshold
  };
  
  dialogVisible.value = true;
};

// 确认修改
const handleConfirm = async () => {
  if (currentEditId.value === null) return;

  try {
    const response = await fetch('/manage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: currentEditId.value,
        ...editForm.value
      })
    });

    const data = await response.json();
    if (data.code === 200) {
      const updatedDevice = data.data.device;
      const index = props.deviceList.findIndex(d => d.id === updatedDevice.id);
      if (index !== -1) {
        props.deviceList[index] = updatedDevice;
      }

      ElMessage({
        type: 'success',
        message: '设备信息已更新'
      });
    } else {
      ElMessage({
        type: 'error',
        message: '更新失败'
      });
    }
  } catch (error) {
    console.error('更新设备信息失败:', error);
    ElMessage({
      type: 'error',
      message: '更新失败'
    });
  }

  dialogVisible.value = false;
};

// 取消修改
const handleCancel = () => {
  dialogVisible.value = false;
  ElMessage({
    type: 'info',
    message: '取消修改'
  });
};
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <div class="demo-collapse">
      <div class="device-info flex justify-between items-center">
        <span class="label text-center w-1/6">ID</span>
        <span class="label text-center w-1/6">设备名称</span>
        <span class="label text-center w-1/6">设备类型</span>
        <span class="label text-center w-1/6">序列号</span>
        <span class="label text-center w-1/6">密码</span>
        <span class="label text-center w-1/6">温度阈值</span>
        <span class="label text-center w-1/6">湿度阈值</span>
        <span class="label text-center w-1/6">操作</span>
        <div class="device-info-content w-5"></div>
      </div>
   
      <ElCollapse v-model="activePanel" accordion>
        <ElCollapseItem 
          v-for="device in props.deviceList" 
          :key="device.id" 
          :name="String(device.id)"
        >
          <template #title>
            <div class="device-info flex justify-between items-center w-100%">
              <div class="value text-center w-1/6">{{ device.id }}</div>
              <div class="value text-center w-1/6">{{ device.name }}</div>
              <div class="value text-center w-1/6">{{ device.type }}</div>
              <div class="value text-center w-1/6">{{ device.serialNumber }}</div>
              <div class="value text-center w-1/6">{{ device.password }}</div>
              <div class="value text-center w-1/6">{{ device.temperatureThreshold || '-' }}</div>
              <div class="value text-center w-1/6">{{ device.humidityThreshold || '-' }}</div>
              <div class="text-center w-1/6">
                <ElButton type="primary" size="small" class="edit-btn" @click.stop="handleEdit(device.id)">编辑</ElButton>
                <el-popconfirm title="确定要删除吗？" @click.stop>
                  <template #reference>
                    <ElButton type="danger" size="small" class="edit-btn" @click.stop>删除</ElButton>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </template>
          <div>
            <LineChart 
              :temperature-data="device.temperature"
              :humidity-data="device.humidity"
            />
          </div>
        </ElCollapseItem>
      </ElCollapse>
    </div>
  </NCard>

  <!-- 添加编辑对话框 -->
  <el-dialog
    v-model="dialogVisible"
    title="修改设备信息"
    width="30rem"
  >
    <el-form :model="editForm" label-width="6rem">
      <el-form-item label="设备名称">
        <el-input v-model="editForm.name" placeholder="请输入设备名称" />
      </el-form-item>
      <el-form-item label="设备类型">
        <el-input v-model="editForm.type" placeholder="请输入设备类型" />
      </el-form-item>
      <el-form-item label="序列号">
        <el-input v-model="editForm.serialNumber" placeholder="请输入序列号" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="editForm.password" placeholder="请输入密码" />
      </el-form-item>
      <el-form-item label="温度阈值">
        <el-input v-model.number="editForm.temperatureThreshold" type="number" placeholder="请输入温度阈值" />
      </el-form-item>
      <el-form-item label="湿度阈值">
        <el-input v-model.number="editForm.humidityThreshold" type="number" placeholder="请输入湿度阈值" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.edit-form {
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item .label {
  margin-bottom: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>