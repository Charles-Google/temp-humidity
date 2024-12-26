<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import type { PropType } from 'vue';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useEcharts } from '@/hooks/common/echarts';

defineOptions({
  name: 'DualLineCharts'
});

const appStore = useAppStore();

// 定义 props
const props = defineProps({
  temperatureData: {
    type: Array,
    required: true
  },
  humidityData: {
    type: Array as PropType<number[] | null>,
    default: null
  },
  temperatureThreshold: {
    type: Object as PropType<{ min: number, max: number }>,
    default: null
  },
  humidityThreshold: {
    type: Object as PropType<{ min: number, max: number }>,
    default: null
  }
});

// 左边的图表：downloadCount
const { domRef: domRefLeft, updateOptions: updateOptionsLeft } = useEcharts(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    data: [$t('page.home.downloadCount')],
    right: '13%'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00']
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
      show: true
    },
    markLine: {
      data: props.temperatureThreshold ? [
        { yAxis: props.temperatureThreshold.min, lineStyle: { color: 'orange', type: 'dashed' } },
        { yAxis: props.temperatureThreshold.max, lineStyle: { color: 'red', type: 'dashed' } }
      ] : []
    }
  },
  series: [
    {
      color: '#8e9dff',
      name: $t('page.home.downloadCount'),
      type: 'line',
      smooth: false,
      data: props.temperatureData || [],
      itemStyle: {
        color: params => {
          return params.data > 6000 ? 'red' : '#8e9dff';
        }
      }
    }
  ]
}), {
  onRender: (chart) => {
    console.log('Left chart data:', props.temperatureData);
    chart.setOption({
      series: [{
        data: props.temperatureData
      }]
    });
    chart.hideLoading();
  }
});

// 右边的图表：registerCount
const { domRef: domRefRight, updateOptions: updateOptionsRight } = useEcharts(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    data: [$t('page.home.registerCount')],
    right: '13%'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00']
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
      show: true
    },
    markLine: {
      data: props.humidityThreshold ? [
        { yAxis: props.humidityThreshold.min, lineStyle: { color: 'orange', type: 'dashed' } },
        { yAxis: props.humidityThreshold.max, lineStyle: { color: 'red', type: 'dashed' } }
      ] : []
    }
  },
  series: [
    {
      color: '#26deca',
      name: $t('page.home.registerCount'),
      type: 'line',
      smooth: false,
      data: props.humidityData || [],
      itemStyle: {
        color: params => {
          return params.data > 6000 ? 'red' : '#26deca';
        }
      }
    }
  ]
}), {
  onRender: (chart) => {
    console.log('Right chart data:', props.humidityData);
    chart.setOption({
      series: [{
        data: props.humidityData
      }]
    });
    chart.hideLoading();
  }
});

watch(() => props.temperatureData, (newData) => {
  // console.log('Temperature data updated:', newData);
  updateOptionsLeft(opts => {
    opts.series[0].data = newData;
    return opts;
  });
}, { immediate: true });

watch(() => props.humidityData, (newData) => {
  // console.log('Humidity data updated:', newData);
  updateOptionsRight(opts => {
    opts.series[0].data = newData;
    return opts;
  });
}, { immediate: true });

watch(() => props.temperatureThreshold, (newThreshold) => {
  if (newThreshold) {
    updateOptionsLeft(opts => {
      opts.yAxis.markLine = {
        data: [
          { yAxis: newThreshold.min, lineStyle: { color: 'orange', type: 'dashed' } },
          { yAxis: newThreshold.max, lineStyle: { color: 'red', type: 'dashed' } }
        ]
      };
      return opts;
    });
  }
}, { deep: true });

watch(() => props.humidityThreshold, (newThreshold) => {
  if (newThreshold) {
    updateOptionsRight(opts => {
      opts.yAxis.markLine = {
        data: [
          { yAxis: newThreshold.min, lineStyle: { color: 'orange', type: 'dashed' } },
          { yAxis: newThreshold.max, lineStyle: { color: 'red', type: 'dashed' } }
        ]
      };
      return opts;
    });
  }
}, { deep: true });

const loading = ref(true);

onMounted(() => {
  setTimeout(() => {
    loading.value = false;
  }, 500);
});
</script>

<template>
  <el-skeleton :loading="loading" animated>
    <template #template>
      <div class="chart-skeleton">
        <div class="chart-body-skeleton">
          <el-skeleton-item variant="p" style="height: 320px" />
        </div>
      </div>
    </template>
    <template #default>
      <NCard :bordered="false" class="card-wrapper">
        <div class="flex">
          <div ref="domRefLeft" class="h-80 w-1/2 overflow-hidden"></div>
          <div ref="domRefRight" class="h-80 w-1/2 overflow-hidden"></div>
        </div>
      </NCard>
    </template>
  </el-skeleton>
</template>

<style scoped>
.chart-skeleton {
  padding: 16px;
}

.chart-header-skeleton {
  margin-bottom: 16px;
}

.chart-body-skeleton {
  background-color: #f8f9fa;
  border-radius: 4px;
}
</style>
