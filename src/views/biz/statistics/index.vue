<template>
  <div class="app-container">
    <el-row :gutter="32">
      <el-col :xs="24" :sm="24" :lg="12">
        <div class="chart-wrapper">
          <div ref="rankChart" style="height: 350px;"></div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="24" :lg="12">
        <div class="chart-wrapper">
          <div ref="pieChart" style="height: 350px;"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import { getActivityStats } from "@/api/biz/activity";

export default {
  name: "ActivityStatistics",
  data() {
    return {
      // ❌ 千万不要在这里定义 rankChart 和 pieChart
      // 否则 Vue 3 会强制将 ECharts 实例变为 Proxy，导致页面切换时崩溃
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart();
    });
    window.addEventListener('resize', this.resizeCharts);
  },
  // Vue 3 使用 beforeUnmount 而不是 beforeDestroy
  beforeUnmount() {
    window.removeEventListener('resize', this.resizeCharts);
    // 销毁实例，防止内存泄漏
    if (this.rankChart) {
      this.rankChart.dispose();
      this.rankChart = null;
    }
    if (this.pieChart) {
      this.pieChart.dispose();
      this.pieChart = null;
    }
  },
  methods: {
    resizeCharts() {
      if (this.rankChart) this.rankChart.resize();
      if (this.pieChart) this.pieChart.resize();
    },
    initChart() {
      getActivityStats().then(response => {
        // 简单容错处理
        const data = response.data || { 
          rankCategories: [], 
          rankData: [], 
          pieData: [] 
        };

        // 1. 初始化学科排名图表
        // ✅ 直接赋值给 this，绕过 Vue 的响应式系统
        this.rankChart = echarts.init(this.$refs.rankChart);
        this.rankChart.setOption({
          title: { text: '热门学科活跃度排名', left: 'center' },
          tooltip: { trigger: 'axis' },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: { 
            type: 'category', 
            data: data.rankCategories,
            axisLabel: { interval: 0, rotate: 30 }
          },
          yAxis: { type: 'value' },
          series: [{
            name: '参与人数',
            data: data.rankData,
            type: 'bar',
            barWidth: '40%',
            itemStyle: { color: '#409EFF' }
          }]
        });

        // 2. 初始化类型占比图表
        // ✅ 直接赋值给 this
        this.pieChart = echarts.init(this.$refs.pieChart);
        this.pieChart.setOption({
          title: { text: '活动类型占比', left: 'center' },
          tooltip: { trigger: 'item' },
          legend: { bottom: '0%' },
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
              label: { show: true, fontSize: '20', fontWeight: 'bold' }
            },
            data: data.pieData
          }]
        });
      }).catch(error => {
        console.error("加载统计数据失败:", error);
        // this.$message.warning("统计数据加载失败");
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.chart-wrapper {
  background: #fff;
  padding: 16px 16px 0;
  margin-bottom: 32px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  border-radius: 4px;
}
</style>