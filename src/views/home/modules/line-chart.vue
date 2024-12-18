<script setup lang="ts">
import { watch } from 'vue';
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
    name: $t('page.home.downloadCount'),
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
      data: [{ yAxis: 6000, lineStyle: { color: 'red', type: 'dashed' } }]
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
    name: $t('page.home.registerCount'),
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
      data: [{ yAxis: 8000, lineStyle: { color: 'red', type: 'dashed' } }]
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
  console.log('Temperature data updated:', newData);
  updateOptionsLeft(opts => {
    opts.series[0].data = newData;
    return opts;
  });
}, { immediate: true });

watch(() => props.humidityData, (newData) => {
  console.log('Humidity data updated:', newData);
  updateOptionsRight(opts => {
    opts.series[0].data = newData;
    return opts;
  });
}, { immediate: true });
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <div class="flex">
      <!-- 左边的图表 -->
      <div ref="domRefLeft" class="h-80 w-1/2 overflow-hidden"></div>
      <!-- 右边的图表 -->
      <div ref="domRefRight" class="h-80 w-1/2 overflow-hidden"></div>
    </div>
  </NCard>
</template>
