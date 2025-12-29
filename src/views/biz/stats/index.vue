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
            <span class="title">学科活跃度排名</span>
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
      <el-col :span="12">
        <div class="chart-box">
          <div class="chart-header">
            <span class="title">参与热力图</span>
            <el-tag size="small" effect="plain">最近30天</el-tag>
          </div>
          <div ref="heatmapChartRef" class="chart-content" style="height: 280px;"></div>
        </div>
      </el-col>
      
      <el-col :span="12">
        <div class="chart-box">
          <div class="chart-header">
            <span class="title">反馈趋势统计</span>
            <el-tag size="small" effect="plain">按周统计</el-tag>
          </div>
          <div ref="trendChartRef" class="chart-content" style="height: 280px;"></div>
        </div>
      </el-col>
    </el-row>

  </div>
</template>

<script setup name="Stats">
import { getStatsData } from "@/api/biz/stats";
import { getHeatmapData, getFeedbackTrend } from "@/api/biz/activity";
import { onMounted, ref, nextTick, onUnmounted } from "vue";
import * as echarts from 'echarts';
import { DataBoard, User, OfficeBuilding, Trophy } from '@element-plus/icons-vue';

const stats = ref({
  activityCount: 0,
  venueCount: 0,
  totalParticipants: 0,
  checkinRate: '0.0'
});

// 图表 DOM 引用
const barChartRef = ref(null);
const pieChartRef = ref(null);
const heatmapChartRef = ref(null);
const trendChartRef = ref(null);

let barChart = null;
let pieChart = null;
let heatmapChart = null;
let trendChart = null;

function initBarChart(data) {
  if (!barChartRef.value) return;
  barChart = echarts.init(barChartRef.value);
  
  const rankCategories = data.rankCategories || [];
  const rankData = data.rankData || [];
  
  barChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: rankCategories, 
      axisLabel: { interval: 0, rotate: 15 } 
    },
    yAxis: { type: 'value', name: '参与人数' },
    series: [{
      name: '参与人数',
      type: 'bar',
      barWidth: '40%',
      data: rankData,
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

function initPieChart(data) {
  if (!pieChartRef.value) return;
  pieChart = echarts.init(pieChartRef.value);
  
  const pieData = data.pieData || [];
  
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: { top: '5%', left: 'center' },
    series: [{
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
      data: pieData
    }]
  });
}

function initHeatmapChart() {
  if (!heatmapChartRef.value) return;
  heatmapChart = echarts.init(heatmapChartRef.value);
  
  getHeatmapData().then(res => {
    const heatmapData = res.data.heatmapData || [];
    
    if (heatmapData.length === 0) {
      heatmapChart.setOption({
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      });
      return;
    }
    
    // 转换数据格式：将日期字符串转换为数组格式 [日期, 值]
    const calendarData = heatmapData.map(item => [item.date, item.value]);
    
    // 计算最大值用于visualMap
    const maxValue = Math.max(...calendarData.map(d => d[1]), 1);
    
    heatmapChart.setOption({
      tooltip: {
        position: 'top',
        formatter: function (params) {
          if (!params.value || !params.value[0]) return '';
          return params.value[0] + '<br/>参与人数: ' + params.value[1];
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        top: 'top',
        inRange: {
          color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
        }
      },
      calendar: {
        top: 60,
        left: 30,
        right: 30,
        cellSize: ['auto', 13],
        range: [res.data.startDate || '', res.data.endDate || ''],
        itemStyle: {
          borderWidth: 0.5,
          borderColor: '#fff'
        },
        yearLabel: { show: false }
      },
      series: [{
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: calendarData
      }]
    });
  }).catch(err => {
    console.error('获取热力图数据失败', err);
  });
}

function initTrendChart() {
  if (!trendChartRef.value) return;
  trendChart = echarts.init(trendChartRef.value);
  
  getFeedbackTrend().then(res => {
    const trendData = res.data.trendData || [];
    
    if (trendData.length === 0) {
      trendChart.setOption({
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#999', fontSize: 16 }
        }
      });
      return;
    }
    
    const weeks = trendData.map(item => item.week);
    const avgScores = trendData.map(item => item.avgScore || 0);
    const feedbackCounts = trendData.map(item => item.feedbackCount || 0);
    
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['平均评分', '评价数量'], top: '5%' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: weeks },
      yAxis: [
        { type: 'value', name: '平均评分', position: 'left' },
        { type: 'value', name: '评价数量', position: 'right' }
      ],
      series: [
        {
          name: '平均评分',
          type: 'line',
          yAxisIndex: 0,
          data: avgScores,
          smooth: true,
          itemStyle: { color: '#409EFF' },
          areaStyle: { opacity: 0.3 }
        },
        {
          name: '评价数量',
          type: 'bar',
          yAxisIndex: 1,
          data: feedbackCounts,
          itemStyle: { color: '#67C23A' }
        }
      ]
    });
  }).catch(err => {
    console.error('获取反馈趋势数据失败', err);
    trendChart.setOption({
      title: {
        text: '数据加载失败',
        left: 'center',
        top: 'middle',
        textStyle: { color: '#999', fontSize: 16 }
      }
    });
  });
}

function resizeCharts() {
  barChart && barChart.resize();
  pieChart && pieChart.resize();
  heatmapChart && heatmapChart.resize();
  trendChart && trendChart.resize();
}

// 获取数据
function getData() {
  getStatsData().then(res => {
    const data = res.data || {};
    
    // 更新统计数据
    stats.value = {
      activityCount: data.statusDistribution ? 
        (data.statusDistribution.draft + data.statusDistribution.published + data.statusDistribution.finished) : 0,
      venueCount: data.venueCount || 0, // 后端可能未提供，需要后端添加
      totalParticipants: data.totalRegistrations || 0,
      checkinRate: data.checkinRate || '0.0'
    };
    
    nextTick(() => {
      initBarChart(data);
      initPieChart(data);
      initHeatmapChart();
      initTrendChart();
    });
  }).catch(err => {
    console.error('获取统计数据失败', err);
    // 使用默认值，避免页面显示异常
    stats.value = {
      activityCount: 0,
      venueCount: 0,
      totalParticipants: 0,
      checkinRate: '0.0'
    };
  });
}

// 窗口大小改变时重绘图表
const handleResize = () => resizeCharts();

onMounted(() => {
  getData();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  barChart && barChart.dispose();
  pieChart && pieChart.dispose();
  heatmapChart && heatmapChart.dispose();
  trendChart && trendChart.dispose();
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
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 4px 20px 0 rgba(0,0,0,0.1);
  }
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #f0f0f0;
    
    .title { 
      font-size: 16px; 
      font-weight: bold; 
      color: #333; 
      border-left: 4px solid #409EFF; 
      padding-left: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .chart-content {
    height: 350px;
    width: 100%;
    min-height: 280px;
  }
}
</style>