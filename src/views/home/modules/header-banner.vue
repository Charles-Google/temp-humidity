<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useAuthStore } from '@/store/modules/auth';
import SunLogo from '@/components/common/sun-logo.vue';
import { ElMessage } from 'element-plus';
import { localStg } from '@/utils/storage';

defineOptions({
  name: 'HeaderBanner'
});

const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

// 获取用户名
const userName = computed(() => {
  const storedUserName = localStg.get('storedUserName') as string | undefined;
  return authStore.userInfo.userName || storedUserName || '用户';
});

// 检查用户登录状态
const checkLoginStatus = async () => {
  const storedUserName = localStg.get('storedUserName') as string | undefined;
  if (!authStore.isLogin || !storedUserName || storedUserName === '用户' || userName.value === '用户') {
    ElMessage.warning('请在登录后查看');
    try {
      await router.push('/login');
    } catch (error) {
      console.error('路由跳转失败:', error);
    }
    return false;
  }
  return true;
};

onMounted(async () => {
  // 初始化用户信息
  await authStore.initUserInfo();
  const loginStatus = await checkLoginStatus();
  if (!loginStatus) {
    return; // 如果登录检查失败，直接返回，不执行后续逻辑
  }
});

// 添加 watch 以监听登录状态变化
watch(() => authStore.isLogin, async (newVal) => {
  if (!newVal) {
    await checkLoginStatus();
  }
});

const gap = computed(() => (appStore.isMobile ? 0 : 16));

const props = defineProps({
  deviceTotal: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['refreshDevices']);

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

// 定义响应式变量
const dialogVisible = ref(false);

// 定义表单数据
const newDeviceForm = ref({
  name: '',
  type: '',
  serialNumber: '',
  password: ''
});

// 添加权限检查
const isAdmin = computed(() => authStore.userInfo.userName?.toLowerCase() === 'admin');

// 显示对话框的函数
const showAddDeviceDialog = () => {
  dialogVisible.value = true;
};

// 新增设备的函数
const addDevice = async () => {
  if (!isAdmin.value) {
    ElMessage.error('权限不足，请联系管理员');
    return;
  }

  if (!(await validateForm())) return;

  try {
    const response = await fetch('/device/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        name: newDeviceForm.value.name,
        type: newDeviceForm.value.type,
        sn: newDeviceForm.value.serialNumber,
        passwd: newDeviceForm.value.password
      }])
    });

    const data = await response.json();
    if (data.status === 1) {
      ElMessage.success(data.message || '设备新增成功');
      emit('refreshDevices');
      dialogVisible.value = false;
    } else {
      ElMessage.error(data.message || '设备新增失败');
    }
  } catch (error) {
    console.error('新增设备失败:', error);
    ElMessage.error('新增设备失败');
  }
};

// 表单验证函数
const validateForm = async () => {
  // 这里假设有一个表单验证逻辑
  return true;
};
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <NGrid :x-gap="gap" :y-gap="16" responsive="screen" item-responsive>
      <NGi span="24 s:24 m:18">
        <div class="flex-y-center">
          <SunLogo class="mr-3 h-18 w-18" />
          <div class="welcome-text">
            <h1 class="text-2xl font-bold">欢迎回来, {{ userName }}</h1>
            <p class="text-gray-500 text-lg">当前设备总数: <span class="font-bold text-black">{{ props.deviceTotal }}</span>，正常运行中</p>
          </div>
        </div>
      </NGi>
      <NGi span="24 s:24 m:6">
        <NSpace :size="24" justify="end" align="center">
          <div><div class="mb-2">新增设备</div>
          <NButton type="primary" circle class="flex flex-col items-center ml-3 text-4xl pb-.6" @click="showAddDeviceDialog" >+</NButton></div>
          <NStatistic v-for="item in statisticData" :key="item.id" class="whitespace-nowrap text-center" v-bind="item" />
        </NSpace>
      </NGi>
    </NGrid>
  </NCard>

  <el-dialog
    v-model="dialogVisible"
    title="新增设备"
    width="30rem"
  >
    <el-form ref="formRef" :model="newDeviceForm" label-width="6rem" :rules="{
      name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
      type: [{ required: true, message: '请输入设备类型', trigger: 'blur' }],
      serialNumber: [{ required: true, message: '请输入序列号', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    }">
      <el-form-item label="设备名称" prop="name">
        <el-input v-model="newDeviceForm.name" placeholder="请输入设备名称" />
      </el-form-item>
      <el-form-item label="设备类型" prop="type">
        <el-input v-model="newDeviceForm.type" placeholder="请输入设备类型" />
      </el-form-item>
      <el-form-item label="序列号" prop="serialNumber">
        <el-input v-model="newDeviceForm.serialNumber" placeholder="请输入序列号" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="newDeviceForm.password" placeholder="请输入密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addDevice">确认</el-button>
      </span>
    </template>
  </el-dialog>
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
