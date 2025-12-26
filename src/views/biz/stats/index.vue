<template>
  <div class="app-container dashboard-container">
    
    <el-row :gutter="20" class="mb20">
      <el-col :span="6">
        <div class="stat-card card-1">
          <div class="card-icon"><el-icon><DataBoard /></el-icon></div>
          <div class="card-info">
            <div class="num">{{ stats.activityCount }}</div>
            <div class="label">累计发布活动</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-2">
          <div class="card-icon"><el-icon><User /></el-icon></div>
          <div class="card-info">
            <div class="num">{{ stats.totalParticipants }}</div>
            <div class="label">累计参与人次</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-3">
          <div class="card-icon"><el-icon><OfficeBuilding /></el-icon></div>
          <div class="card-info">
            <div class="num">{{ stats.venueCount }}</div>
            <div class="label">可用场地资源</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-4">
          <div class="card-icon"><el-icon><Trophy /></el-icon></div>
          <div class="card-info">
            <div class="num">{{ stats.checkinRate }}%</div>
            <div class="label">平均签到率</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="chart-box">
          <div class="chart-header">
            <span class="title">热门活动热度排行 (Top 5)</span>
            <el-tag size="small" effect="plain">实时数据</el-tag>
          </div>
          <div ref="barChartRef" class="chart-content"></div>
        </div>
      </el-col>
      
      <el-col :span="8">
        <div class="chart-box">
          <div class="chart-header">
            <span class="title">活动类型占比</span>
          </div>
          <div ref="pieChartRef" class="chart-content"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt20">
      <el-col :span="24">
        <div class="chart-box">
          <div class="chart-header">
            <span class="title">系统最新动态</span>
          </div>
          <el-table :data="recentLogs" style="width: 100%" :show-header="false">
             <el-table-column width="100">
               <template #default="scope">
                 <el-tag :type="scope.row.type">{{ scope.row.tag }}</el-tag>
               </template>
             </el-table-column>
             <el-table-column prop="content" />
             <el-table-column prop="time" width="180" align="right" style="color: #999" />
          </el-table>
        </div>
      </el-col>
    </el-row>

  </div>
</template>

<script setup name="Stats">
import { getStatsData } from "@/api/biz/stats";
import { onMounted, ref, reactive, nextTick } from "vue";
import * as echarts from 'echarts';
import { DataBoard, User, OfficeBuilding, Trophy } from '@element-plus/icons-vue';

const stats = ref({
  activityCount: 0,
  venueCount: 0,
  totalParticipants: 0,
  checkinRate: 0
});

// 模拟日志数据
const recentLogs = ref([
  { tag: '报名', type: 'success', content: '张三 报名了《人工智能前沿讲座》', time: '10分钟前' },
  { tag: '发布', type: 'primary', content: '教务处 发布了新活动《2025春季运动会》', time: '1小时前' },
  { tag: '评价', type: 'warning', content: '李四 对《Python入门》给出了 5星 好评', time: '2小时前' },
  { tag: '学分', type: 'danger', content: '系统自动为 50 名同学发放了活动学分', time: '昨天' },
]);

// 图表 DOM 引用
const barChartRef = ref(null);
const pieChartRef = ref(null);

let barChart = null;
let pieChart = null;

function initCharts(data) {
  // 1. 初始化柱状图
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value);
    barChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: data.rankNames, axisLabel: { interval: 0, rotate: 15 } },
      yAxis: { type: 'value' },
      series: [{
        name: '热度',
        type: 'bar',
        barWidth: '40%',
        data: data.rankValues,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }]
    });
  }

  // 2. 初始化饼图
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value);
    pieChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { top: '5%', left: 'center' },
      series: [
        {
          name: '活动类型',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 20, fontWeight: 'bold' }
          },
          labelLine: { show: false },
          data: data.typeData
        }
      ]
    });
  }
}

// 获取数据
function getData() {
  getStatsData().then(res => {
    stats.value = res.data;
    nextTick(() => {
      initCharts(res.data);
    });
  });
}

// 窗口大小改变时重绘图表
window.addEventListener('resize', () => {
  barChart && barChart.resize();
  pieChart && pieChart.resize();
});

onMounted(() => {
  getData();
});
</script>

<style scoped lang="scss">
.dashboard-container {
  background: #f0f2f5;
  min-height: calc(100vh - 84px);
  padding: 20px;
}

.mb20 { margin-bottom: 20px; }
.mt20 { margin-top: 20px; }

/* 1. 核心指标卡片 */
.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  transition: all 0.3s;
  cursor: default;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  }

  .card-icon {
    width: 60px; height: 60px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 30px;
    margin-right: 20px;
  }
  
  .card-info {
    .num { font-size: 28px; font-weight: bold; color: #333; margin-bottom: 5px; }
    .label { font-size: 14px; color: #909399; }
  }

  /* 不同颜色的卡片 */
  &.card-1 .card-icon { background: rgba(64,158,255,0.1); color: #409EFF; }
  &.card-2 .card-icon { background: rgba(103,194,58,0.1); color: #67C23A; }
  &.card-3 .card-icon { background: rgba(230,162,60,0.1); color: #E6A23C; }
  &.card-4 .card-icon { background: rgba(245,108,108,0.1); color: #F56C6C; }
}

/* 2. 图表容器 */
.chart-box {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #f0f0f0;
    
    .title { font-size: 16px; font-weight: bold; color: #333; border-left: 4px solid #409EFF; padding-left: 10px; }
  }
  
  .chart-content {
    height: 350px;
    width: 100%;
  }
}
</style>