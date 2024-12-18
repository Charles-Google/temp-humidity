<script setup lang="ts">
import { ref, PropType } from 'vue';
import { InfoFilled } from '@element-plus/icons-vue';
import LineChart from './line-chart.vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import HeaderBanner from './header-banner.vue';

// 定义数据
const downloadData = [25.3, 26.1, 25.8, 26.4, 27.2, 26.8, 25.9, 25.4, 25.7, 26.2]; // 温度数据
const registerData = [45, 48, 52, 49, 47, 51, 53, 50, 48, 46]; // 湿度数据

// 在 script setup 中修改 props 定义
interface Device {
  id: number;
  name: string;
  type: string;
  serialNumber: string;
  password: string;
}

const props = defineProps({
  deviceList: {
    type: Array as PropType<Device[]>,
    required: true
  }
});

// 当前活动面板
const activePanel = ref<string | string[]>('1');

console.log('Download data:', downloadData); // 添加日志
console.log('Register data:', registerData); // 添加日志

// 添加编辑表单的响应式数据
const editForm = ref({
  name: '',
  type: '',
  serialNumber: '',
  password: ''
});

// 控制对话框显示
const dialogVisible = ref(false);

// 当前编辑的设备ID
const currentEditId = ref<number | null>(null);

// 处理编辑按钮点击事件
const handleEdit = (deviceId: number) => {
  const device = props.deviceList.find(d => d.id === deviceId);
  if (!device) return;
  
  // 设置当前编辑的设备数据
  currentEditId.value = deviceId;
  editForm.value = {
    name: device.name,
    type: device.type,
    serialNumber: device.serialNumber,
    password: device.password
  };
  
  dialogVisible.value = true;
};

// 确认修改
const handleConfirm = () => {
  if (currentEditId.value === null) return;
  
  const device = props.deviceList.find(d => d.id === currentEditId.value);
  if (!device) return;

  // 更新设备信息
  device.name = editForm.value.name;
  device.type = editForm.value.type;
  device.serialNumber = editForm.value.serialNumber;
  device.password = editForm.value.password;

  ElMessage({
    type: 'success',
    message: '设备信息已更新'
  });
  
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
              <div class="text-center w-1/6">
                <ElButton type="primary" size="small" class="edit-btn" @click.stop="handleEdit(device.id)">修改</ElButton>
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
              :temperature-data="downloadData"
              :humidity-data="registerData"
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
    width="500px"
  >
    <div class="edit-form">
      <div class="form-item">
        <div class="label">设备名称：</div>
        <el-input v-model="editForm.name" placeholder="请输入设备名称" />
      </div>
      <div class="form-item">
        <div class="label">设备类型：</div>
        <el-input v-model="editForm.type" placeholder="请输入设备类型" />
      </div>
      <div class="form-item">
        <div class="label">序列号：</div>
        <el-input v-model="editForm.serialNumber" placeholder="请输入序列号" />
      </div>
      <div class="form-item">
        <div class="label">密码：</div>
        <el-input v-model="editForm.password" placeholder="请输入密码" />
      </div>
    </div>
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