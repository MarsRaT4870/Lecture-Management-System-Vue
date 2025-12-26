<template>
  <div class="app-container evaluation-container">
    <el-row :gutter="20" class="mb20">
      <el-col :span="6">
        <div class="dashboard-card bg-gradient-blue">
          <div class="card-title">综合评分</div>
          <div class="card-content center-align">
            <span class="big-score">{{ stats.avgScore }}</span>
            <div class="stars-wrapper">
              <el-rate v-model="stats.avgScore" disabled text-color="#fff" score-template="{value}" />
              <span class="sub-text">基于 {{ evalList.length }} 条评价</span>
            </div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="12">
        <div class="dashboard-card bg-white">
          <div class="card-title text-dark">评分分布</div>
          <div class="dist-chart">
            <div class="dist-row" v-for="i in 5" :key="i">
              <span class="star-label">{{ 6-i }} 星</span>
              <el-progress 
                :percentage="getDistPercent(6-i)" 
                :color="getDistColor(6-i)" 
                :stroke-width="10" 
                :show-text="false"
                class="dist-bar"
              />
              <span class="count-label">{{ getDistCount(6-i) }}人</span>
            </div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="dashboard-card bg-gradient-purple">
          <div class="card-title">今日新增</div>
          <div class="card-content center-align">
            <span class="big-number">+{{ stats.todayCount }}</span>
            <span class="sub-text">条新反馈</span>
            <el-icon class="bg-icon"><ChatLineRound /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="filter-bar">
      <div class="filter-group">
        <span 
          class="filter-tag" 
          :class="{ active: currentFilter === 'all' }"
          @click="currentFilter = 'all'"
        >全部</span>
        <span 
          class="filter-tag tag-good" 
          :class="{ active: currentFilter === 'good' }"
          @click="currentFilter = 'good'"
        >好评 (4-5星)</span>
        <span 
          class="filter-tag tag-bad" 
          :class="{ active: currentFilter === 'bad' }"
          @click="currentFilter = 'bad'"
        >需改进 (1-3星)</span>
      </div>
      
      <div class="search-group">
        <el-button type="danger" plain icon="Delete" :disabled="!multiple" @click="handleDeleteBatch">批量删除</el-button>
        <el-button icon="Refresh" circle @click="getList" />
      </div>
    </div>

    <div class="review-list" v-loading="loading">
      <el-empty v-if="filteredList.length === 0" description="暂无符合条件的评价" />
      
      <transition-group name="el-fade-in-linear">
        <div 
          class="review-card" 
          v-for="item in filteredList" 
          :key="item.evalId"
          :class="{ 'is-selected': ids.includes(item.evalId) }"
          @click="toggleSelection(item.evalId)"
        >
          <div class="card-check" v-if="ids.includes(item.evalId)">
            <el-icon><Select /></el-icon>
          </div>

          <div class="card-header">
            <div class="user-info">
              <el-avatar :size="40" :style="{ backgroundColor: extractColor(item.userName) }">
                {{ item.userName ? item.userName.charAt(0) : 'U' }}
              </el-avatar>
              <div class="user-meta">
                <span class="username">{{ item.userName }}</span>
                <span class="time">{{ parseTime(item.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
              </div>
            </div>
            <div class="score-badge">
              <el-rate v-model="item.score" disabled text-color="#ff9900" />
            </div>
          </div>

          <div class="card-body">
            <div class="activity-tag">
              <el-icon><CollectionTag /></el-icon> {{ item.activityName || '未知活动' }}
            </div>
            <p class="comment-text">
              {{ item.comment || '用户未填写文字评价，仅评分。' }}
            </p>
          </div>

          <div class="card-footer">
            <el-button 
              type="danger" 
              link 
              icon="Delete" 
              size="small" 
              @click.stop="handleDelete(item)"
            >删除评价</el-button>
          </div>
        </div>
      </transition-group>
    </div>
    
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="Evaluation">
import { listEvaluation, delEvaluation } from "@/api/biz/evaluation";
import { getCurrentInstance, ref, computed, onMounted } from 'vue';
import { parseTime } from "@/utils/ruoyi";
import { ChatLineRound, Delete, Select, CollectionTag } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance();

const evalList = ref([]);
const loading = ref(true);
const ids = ref([]); // 选中的ID
const multiple = ref(false); // 是否多选
const total = ref(0);
const currentFilter = ref('all');

// 统计数据
const stats = ref({
  avgScore: '0.0',
  todayCount: 0,
  dist: { 1:0, 2:0, 3:0, 4:0, 5:0 }
});

const queryParams = ref({
  pageNum: 1,
  pageSize: 20 // 评价可以多加载一点
});

// 计算属性：前端筛选
const filteredList = computed(() => {
  if (currentFilter.value === 'all') return evalList.value;
  if (currentFilter.value === 'good') return evalList.value.filter(item => item.score >= 4);
  if (currentFilter.value === 'bad') return evalList.value.filter(item => item.score <= 3);
  return evalList.value;
});

function getList() {
  loading.value = true;
  listEvaluation(queryParams.value).then(res => {
    evalList.value = res.rows;
    total.value = res.total;
    calculateStats(res.rows);
    loading.value = false;
  });
}

// 核心：前端计算统计数据 (Mock Backend Dashboard)
function calculateStats(list) {
  if (!list || list.length === 0) return;
  
  let sum = 0;
  let today = 0;
  const dist = { 1:0, 2:0, 3:0, 4:0, 5:0 };
  const todayStr = parseTime(new Date(), '{y}-{m}-{d}');
  
  list.forEach(item => {
    sum += item.score;
    // 统计分布
    if (dist[item.score] !== undefined) dist[item.score]++;
    // 统计今日
    if (parseTime(item.createTime, '{y}-{m}-{d}') === todayStr) today++;
  });
  
  stats.value.avgScore = (sum / list.length).toFixed(1);
  stats.value.todayCount = today;
  stats.value.dist = dist;
}

// 辅助：计算进度条百分比
function getDistPercent(star) {
  if (evalList.value.length === 0) return 0;
  return (stats.value.dist[star] / evalList.value.length) * 100;
}
function getDistCount(star) {
  return stats.value.dist[star] || 0;
}
function getDistColor(star) {
  if (star >= 4) return '#67C23A'; // 绿色
  if (star === 3) return '#E6A23C'; // 黄色
  return '#F56C6C'; // 红色
}

// 辅助：根据用户名生成头像颜色
function extractColor(name) {
  if (!name) return '#ccc';
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#3a8ee6'];
  return colors[name.length % colors.length];
}

// 交互：卡片点击选中
function toggleSelection(id) {
  const index = ids.value.indexOf(id);
  if (index > -1) {
    ids.value.splice(index, 1);
  } else {
    ids.value.push(id);
  }
  multiple.value = ids.value.length > 0;
}

// 批量删除
function handleDeleteBatch() {
  if (ids.value.length === 0) return;
  proxy.$modal.confirm('确认删除选中的评论吗？').then(() => {
    return delEvaluation(ids.value.join(','));
  }).then(() => {
    ids.value = [];
    multiple.value = false;
    getList();
    proxy.$modal.msgSuccess("删除成功");
  });
}

// 单个删除
function handleDelete(row) {
  proxy.$modal.confirm('确认删除这条评论吗？').then(() => {
    return delEvaluation(row.evalId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  });
}

getList();
</script>

<style scoped lang="scss">
.evaluation-container {
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
  padding: 20px;
}

/* 1. 看板卡片样式 */
.dashboard-card {
  height: 140px;
  border-radius: 12px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: transform 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  }
  
  .card-title { font-size: 14px; opacity: 0.9; margin-bottom: 10px; font-weight: 600; }
  .card-content { display: flex; flex-direction: column; height: 80px; justify-content: center; }
  
  /* 渐变背景 */
  &.bg-gradient-blue { background: linear-gradient(135deg, #3a8ee6 0%, #005bac 100%); color: #fff; }
  &.bg-gradient-purple { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); color: #fff; }
  &.bg-white { background: #fff; }
  
  .big-score { font-size: 48px; font-weight: bold; line-height: 1; }
  .big-number { font-size: 42px; font-weight: bold; }
  .sub-text { font-size: 12px; opacity: 0.8; margin-top: 5px; }
  .text-dark { color: #333; }
  
  .bg-icon {
    position: absolute;
    right: -10px;
    bottom: -10px;
    font-size: 100px;
    opacity: 0.2;
    transform: rotate(-15deg);
  }
}

/* 分布图样式 */
.dist-chart {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  
  .dist-row {
    display: flex;
    align-items: center;
    font-size: 12px;
    margin-bottom: 4px;
    
    .star-label { width: 40px; color: #666; }
    .dist-bar { flex: 1; margin: 0 10px; }
    .count-label { width: 30px; text-align: right; color: #999; }
  }
}

/* 2. 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .filter-group {
    display: flex;
    gap: 10px;
  }
  
  .filter-tag {
    padding: 6px 20px;
    background: #fff;
    border-radius: 20px;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid #e0e0e0;
    
    &:hover { color: #409EFF; border-color: #409EFF; }
    
    &.active { background: #409EFF; color: #fff; border-color: #409EFF; box-shadow: 0 4px 10px rgba(64,158,255,0.3); }
    &.active.tag-good { background: #67C23A; border-color: #67C23A; box-shadow: 0 4px 10px rgba(103,194,58,0.3); }
    &.active.tag-bad { background: #F56C6C; border-color: #F56C6C; box-shadow: 0 4px 10px rgba(245,108,108,0.3); }
  }
}

/* 3. 评价卡片网格 */
.review-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.review-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  position: relative;
  border: 1px solid #ebeef5;
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    border-color: #c6e2ff;
  }
  
  &.is-selected {
    border-color: #409EFF;
    background: #ecf5ff;
  }
  
  .card-check {
    position: absolute;
    top: 10px;
    right: 10px;
    color: #409EFF;
    font-size: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
    
    .user-info {
      display: flex;
      gap: 10px;
      .username { font-weight: bold; color: #333; font-size: 14px; display: block;}
      .time { font-size: 12px; color: #999; }
    }
  }
  
  .card-body {
    min-height: 80px;
    
    .activity-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #f4f4f5;
      color: #909399;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-bottom: 10px;
    }
    
    .comment-text {
      font-size: 14px;
      color: #555;
      line-height: 1.6;
      margin: 0;
      /* 限制显示行数 */
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }
  }
  
  .card-footer {
    border-top: 1px solid #f0f0f0;
    padding-top: 10px;
    margin-top: 15px;
    text-align: right;
  }
}
</style>