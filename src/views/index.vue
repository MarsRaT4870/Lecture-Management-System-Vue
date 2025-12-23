<template>
  <div class="app-container home">
    <el-row :gutter="20">
      <el-col :sm="24" :lg="6" style="margin-bottom: 20px">
        <el-card shadow="hover" class="info-card">
          <div class="card-header">
            <span>📚 活动总数</span>
            <el-tag type="success">累计</el-tag>
          </div>
          <div class="card-body">
            <span class="num">{{ stats.activityCount }}</span>
            <span class="unit">场</span>
          </div>
        </el-card>
      </el-col>

      <el-col :sm="24" :lg="6" style="margin-bottom: 20px">
        <el-card shadow="hover" class="info-card">
          <div class="card-header">
            <span>🙋‍♂️ 累计报名</span>
            <el-tag type="primary">火热</el-tag>
          </div>
          <div class="card-body">
            <span class="num">{{ stats.regCount }}</span>
            <span class="unit">人次</span>
          </div>
        </el-card>
      </el-col>

      <el-col :sm="24" :lg="6" style="margin-bottom: 20px">
        <el-card shadow="hover" class="info-card">
          <div class="card-header">
            <span>✅ 实际签到</span>
            <el-tag type="warning">到场</el-tag>
          </div>
          <div class="card-body">
            <span class="num">{{ stats.checkinCount }}</span>
            <span class="unit">人</span>
          </div>
        </el-card>
      </el-col>

      <el-col :sm="24" :lg="6" style="margin-bottom: 20px">
        <el-card shadow="hover" class="info-card">
          <div class="card-header">
            <span>⏳ 待审核</span>
            <el-tag type="danger">急需</el-tag>
          </div>
          <div class="card-body">
            <span class="num">{{ stats.auditCount }}</span>
            <span class="unit">人</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :lg="24">
        <el-card shadow="never">
          <template #header>
            <div class="clearfix">
              <span style="font-weight: bold">📊 热门活动排行榜 (Top 5)</span>
            </div>
          </template>
          <div ref="chartRef" style="height: 400px; width: 100%"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Index">
import { ref, onMounted, onBeforeUnmount, reactive } from 'vue';
import * as echarts from 'echarts';
// 【新增】引入刚才定义的 API
import { getActivityStats } from "@/api/biz/activity";

// 1. 统计数据 (默认全是0)
const stats = reactive({
  activityCount: 0,
  regCount: 0,
  checkinCount: 0,
  auditCount: 0
});

// 2. 图表逻辑
const chartRef = ref(null);
let myChart = null;

// 从后端获取真实数据
function getData() {
  getActivityStats().then(response => {
    // 填入卡片数据
    stats.activityCount = response.activityCount;
    stats.regCount = response.regCount;
    stats.checkinCount = response.checkinCount;
    stats.auditCount = response.auditCount;

    // 填入图表数据
    initChart(response.chartX, response.chartY);
  });
}

function initChart(xData, yData) {
  if (myChart != null) {
    myChart.dispose();
  }
  myChart = echarts.init(chartRef.value);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: xData, // 使用后端传来的 X 轴数据
        axisTick: { alignWithLabel: true },
        axisLabel: { interval: 0, rotate: 30 } // 防止名字太长，倾斜一下
      }
    ],
    yAxis: [
      { type: 'value' }
    ],
    series: [
      {
        name: '报名人数',
        type: 'bar',
        barWidth: '50%',
        data: yData, // 使用后端传来的 Y 轴数据
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  };

  myChart.setOption(option);
}

function resizeChart() {
  myChart && myChart.resize();
}

onMounted(() => {
  // 页面加载时请求数据
  getData();
  window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  if (myChart) {
    myChart.dispose();
  }
});
</script>

<style scoped>
.home {
  padding: 20px;
  background-color: #f5f7f9;
}

.info-card {
  height: 120px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.card-body {
  margin-top: 20px;
  text-align: center;
}

.num {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.unit {
  font-size: 14px;
  margin-left: 5px;
  color: #909399;
}
</style>