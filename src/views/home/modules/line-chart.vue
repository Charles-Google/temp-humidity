<template>
  <div class="chart-wrapper">
    <div v-if="loading" class="chart-skeleton">
      <div class="chart-body-skeleton">
        <el-skeleton-item variant="p" style="height: 320px" />
      </div>
    </div>
    <div v-else class="chart-container">
      <div class="flex justify-between">
        <div ref="domRefLeft" class="chart-item"></div>
        <div ref="domRefRight" class="chart-item"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted, nextTick } from 'vue';
import type { PropType } from 'vue';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useEcharts } from '@/hooks/common/echarts';
import * as echarts from 'echarts';
import dayjs from 'dayjs';

defineOptions({
  name: 'DualLineCharts'
});

const appStore = useAppStore();

// 定义 props
const props = defineProps({
  deviceId: {
    type: String,
    required: true
  },
  isVisible: {
    type: Boolean,
    required: true
  },
  thresholds: {
    type: Object,
    default: () => ({
      temperature: { min: -Infinity, max: Infinity },
      humidity: { min: -Infinity, max: Infinity }
    })
  }
});

const loading = ref(true);
const chartLeft = ref();
const chartRight = ref();
const domRefLeft = ref();
const domRefRight = ref();

// 监听阈值变化
watch(() => props.thresholds, (newVal) => {
  console.log('阈值数据变化:', {
    deviceId: props.deviceId,
    thresholds: newVal
  });
  // 当阈值变化时，如果图表已经初始化，则更新图表的颜色
  if (chartLeft.value && chartRight.value) {
    updateChartColors();
  }
}, { deep: true, immediate: true });

// 添加更新图表颜色的方法
const updateChartColors = () => {
  if (!chartLeft.value || !chartRight.value) return;

  const leftOption = chartLeft.value.getOption();
  const rightOption = chartRight.value.getOption();

  if (leftOption.series && leftOption.series[0]) {
    chartLeft.value.setOption({
      series: [{
        itemStyle: {
          color: params => {
            const value = params.data;
            if (value === null || value === undefined) return '#8e9dff';
            return (value < (props.thresholds?.temperature?.min ?? -Infinity) || 
                    value > (props.thresholds?.temperature?.max ?? Infinity)) ? 
                    '#ff4d4f' : '#8e9dff';
          }
        },
        lineStyle: {
          color: '#8e9dff',
          width: 2
        },
        emphasis: {
          scale: true,
          itemStyle: {
            shadowBlur: params => {
              const value = params.data;
              if (value === null || value === undefined) return 5;
              return (value < (props.thresholds?.temperature?.min ?? -Infinity) || 
                      value > (props.thresholds?.temperature?.max ?? Infinity)) ? 
                      20 : 5;
            },
            shadowColor: params => {
              const value = params.data;
              if (value === null || value === undefined) return 'rgba(142,157,255,0.3)';
              return (value < (props.thresholds?.temperature?.min ?? -Infinity) || 
                      value > (props.thresholds?.temperature?.max ?? Infinity)) ? 
                      'rgba(255,77,79,0.5)' : 'rgba(142,157,255,0.3)';
            },
            borderWidth: params => {
              const value = params.data;
              if (value === null || value === undefined) return 1;
              return (value < (props.thresholds?.temperature?.min ?? -Infinity) || 
                      value > (props.thresholds?.temperature?.max ?? Infinity)) ? 
                      3 : 1;
            }
          }
        }
      }]
    }, { notMerge: false });
  }

  if (rightOption.series && rightOption.series[0]) {
    chartRight.value.setOption({
      series: [{
        itemStyle: {
          color: params => {
            const value = params.data;
            if (value === null || value === undefined) return '#26deca';
            return (value < (props.thresholds?.humidity?.min ?? -Infinity) || 
                    value > (props.thresholds?.humidity?.max ?? Infinity)) ? 
                    '#ff4d4f' : '#26deca';
          }
        },
        lineStyle: {
          color: '#26deca',
          width: 2
        },
        emphasis: {
          scale: true,
          itemStyle: {
            shadowBlur: params => {
              const value = params.data;
              if (value === null || value === undefined) return 5;
              return (value < (props.thresholds?.humidity?.min ?? -Infinity) || 
                      value > (props.thresholds?.humidity?.max ?? Infinity)) ? 
                      20 : 5;
            },
            shadowColor: params => {
              const value = params.data;
              if (value === null || value === undefined) return 'rgba(38,222,202,0.3)';
              return (value < (props.thresholds?.humidity?.min ?? -Infinity) || 
                      value > (props.thresholds?.humidity?.max ?? Infinity)) ? 
                      'rgba(255,77,79,0.5)' : 'rgba(38,222,202,0.3)';
            },
            borderWidth: params => {
              const value = params.data;
              if (value === null || value === undefined) return 1;
              return (value < (props.thresholds?.humidity?.min ?? -Infinity) || 
                      value > (props.thresholds?.humidity?.max ?? Infinity)) ? 
                      3 : 1;
            }
          }
        }
      }]
    }, { notMerge: false });
  }
};

// 初始化图表
const initCharts = async () => {
  console.log('开始初始化图表');
  await nextTick();
  
  if (domRefLeft.value && domRefRight.value) {
    console.log('DOM元素存在，开始初始化图表');
    try {
      // 销毁现有实例（如果存在）
      if (chartLeft.value) {
        chartLeft.value.dispose();
      }
      if (chartRight.value) {
        chartRight.value.dispose();
      }

      // 重新初始化
      chartLeft.value = echarts.init(domRefLeft.value);
      chartRight.value = echarts.init(domRefRight.value);
      console.log('图表初始化成功');

      // 基础配置
      const baseConfig = {
        tooltip: {
          show: true,
          trigger: 'item',
          axisPointer: {
            show: false
          },
          backgroundColor: 'var(--el-bg-color-overlay)',
          borderWidth: 1,
          borderColor: 'var(--el-border-color)',
          padding: [10, 15],
          textStyle: {
            color: 'var(--el-text-color-primary)',
            fontSize: 14
          },
          formatter: function(params) {
            const value = params.seriesName === '温度' ? params.value + '°C' : params.value + '%';
            const color = params.seriesName === '温度' ? '#8e9dff' : '#26deca';
            const marker = `<span style="display:inline-block;margin-right:8px;width:10px;height:10px;border-radius:50%;background-color:${color};"></span>`;
            return `<div style="font-weight: bold; margin-bottom: 5px;color:var(--el-text-color-primary);">${params.name}</div>
                    <div style="margin: 3px 0;color:var(--el-text-color-primary);">${marker}${params.seriesName}：${value}</div>`;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '8%',
          top: '11%',
          containLabel: true
        },
        legend: {
          right: '13%',
          top: '2%',
          selectedMode: false,
          textStyle: {
            color: 'var(--el-text-color-regular)',
            fontSize: 12
          }
        }
      };
      
      // 温度图表配置
      console.log('设置温度图表配置');
      await nextTick();
      const tempOptions = {
        ...baseConfig,
        legend: {
          ...baseConfig.legend,
          data: ['温度']
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['加载中'],
          axisLine: {
            lineStyle: {
              color: '#ddd'
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            show: true,
            color: '#666',
            fontSize: 12,
            margin: 12,
            rotate: 0
          }
        },
        yAxis: {
          type: 'value',
          name: '温度',
          axisLine: {
            show: true,
            lineStyle: {
              color: '#8e9dff'
            }
          },
          axisLabel: {
            show: true,
            formatter: '{value}°C'
          },
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: '#eee'
            }
          }
        },
        series: [
          {
            name: '温度',
            type: 'line',
            data: [0],
            smooth: false,
            showSymbol: true,
            symbol: 'circle',
            symbolSize: 8,
            color: '#8e9dff',
            lineStyle: {
              width: 2
            }
          }
        ]
      };
      
      // 湿度图表配置
      console.log('设置湿度图表配置');
      await nextTick();
      const humidOptions = {
        ...baseConfig,
        legend: {
          ...baseConfig.legend,
          data: ['湿度']
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['加载中'],
          axisLine: {
            lineStyle: {
              color: '#ddd'
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            show: true,
            color: '#666',
            fontSize: 12,
            margin: 12,
            rotate: 0
          }
        },
        yAxis: {
          type: 'value',
          name: '湿度',
          axisLine: {
            show: true,
            lineStyle: {
              color: '#26deca'
            }
          },
          axisLabel: {
            show: true,
            formatter: '{value}%'
          },
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: '#eee'
            }
          }
        },
        series: [
          {
            name: '湿度',
            type: 'line',
            data: [0],
            smooth: false,
            showSymbol: true,
            symbol: 'circle',
            symbolSize: 8,
            color: '#26deca',
            lineStyle: {
              width: 2
            }
          }
        ]
      };

      // 设置配置
      await Promise.all([
        chartLeft.value.setOption(tempOptions),
        chartRight.value.setOption(humidOptions)
      ]);

      // 监听窗口大小变化
      window.addEventListener('resize', () => {
        chartLeft.value?.resize();
        chartRight.value?.resize();
      });
      
      return true;
    } catch (error) {
      console.error('图表初始化失败:', error);
      return false;
    }
  } else {
    console.log('DOM元素不存在:', {
      domRefLeft: domRefLeft.value,
      domRefRight: domRefRight.value
    });
    return false;
  }
};

// 获取设备数据
const fetchDeviceData = async () => {
  console.log('fetchDeviceData 被调用，deviceId:', props.deviceId);
  loading.value = true;
  
  try {
    const response = await fetch('/biz/get-device-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': document.cookie
          .split(';')
          .find(cookie => cookie.trim().startsWith('Authorization='))
          ?.split('=')[1]
          ? decodeURIComponent(document.cookie
              .split(';')
              .find(cookie => cookie.trim().startsWith('Authorization='))
              .split('=')[1])
          : ''
      },
      body: JSON.stringify({
        device_id: props.deviceId
      })
    });

    const data = await response.json();
    console.log('获取到的数据:', data);
    
    loading.value = false;
    await nextTick();
    
    const initialized = await initCharts();
    if (!initialized) {
      console.log('图表初始化失败');
      return;
    }

    if (data.status === 1 && data.data && data.data.length > 0) {
      const latestData = data.data.slice(-10);
      const times = [];
      const temperatures = [];
      const humidities = [];

      latestData.forEach(item => {
        times.push(dayjs(item.created_at).format('HH:mm'));
        temperatures.push(Number(item.temperature));
        humidities.push(Number(item.humidity));
      });

      // 更新图表数据
      if (chartLeft.value) {
        chartLeft.value.setOption({
          xAxis: { data: times },
          series: [{ data: temperatures }]
        }, { notMerge: false });
      }

      if (chartRight.value) {
        chartRight.value.setOption({
          xAxis: { data: times },
          series: [{ data: humidities }]
        }, { notMerge: false });
      }

      // 更新颜色
      updateChartColors();
    } else {
      const emptyData = {
        times: ['暂无数据'],
        values: [null]
      };

      if (chartLeft.value) {
        chartLeft.value.setOption({
          xAxis: { data: emptyData.times },
          series: [{ data: emptyData.values }]
        }, { notMerge: false });
      }

      if (chartRight.value) {
        chartRight.value.setOption({
          xAxis: { data: emptyData.times },
          series: [{ data: emptyData.values }]
        }, { notMerge: false });
      }
    }
  } catch (error) {
    console.error('获取设备数据失败:', error);
    loading.value = false;
    
    await nextTick();
    const initialized = await initCharts();
    if (initialized) {
      const emptyData = {
        times: ['获取数据失败'],
        values: [null]
      };

      if (chartLeft.value) {
        chartLeft.value.setOption({
          xAxis: { data: emptyData.times },
          series: [{ data: emptyData.values }]
        }, { notMerge: false });
      }

      if (chartRight.value) {
        chartRight.value.setOption({
          xAxis: { data: emptyData.times },
          series: [{ data: emptyData.values }]
        }, { notMerge: false });
      }
    }
  }
};

// 监听 isVisible 变化
watch(() => props.isVisible, (newVal) => {
  console.log('isVisible 变化:', newVal, '设备ID:', props.deviceId);
  if (newVal) {
    fetchDeviceData();
  }
}, { immediate: true });

// 在组件卸载时销毁图表
onUnmounted(() => {
  chartLeft.value?.dispose();
  chartRight.value?.dispose();
});

// 暴露方法给父组件
defineExpose({
  fetchDeviceData
});
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  background-color: var(--el-bg-color);
  border-radius: 4px;
}

.chart-container {
  padding: 16px;
  background-color: var(--el-bg-color);
}

.chart-item {
  width: 48%;
  height: 320px;
  display: inline-block;
}

.chart-skeleton {
  padding: 16px;
}

.chart-body-skeleton {
  background-color: var(--el-bg-color-overlay);
  border-radius: 4px;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}
</style>
