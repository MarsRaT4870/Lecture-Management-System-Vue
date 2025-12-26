<template>
  <div class="dashboard-container">
    <div class="dashboard-banner">
      <div class="banner-content">
        <div class="greeting">
          <img :src="avatar" class="user-avatar" alt="avatar" />
          <div class="greeting-text">
            <h1>{{ timeFix }}，{{ nickName }}，欢迎回来！</h1>
            <p>当前身份：<el-tag effect="dark" type="warning" round>{{ roles.join(' / ') }}</el-tag></p>
            <p class="subtitle">这里是高校学术讲座与活动一体化管理平台，祝您今天充满收获。</p>
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="20" class="panel-group">
      <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
        <div class="card-panel">
          <div class="card-panel-icon-wrapper icon-activity">
            <el-icon size="40"><Flag /></el-icon>
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">全校活动总数</div>
            <span class="card-panel-num">{{ stats.totalActivity }}</span>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
        <div class="card-panel">
          <div class="card-panel-icon-wrapper icon-date">
            <el-icon size="40"><Calendar /></el-icon>
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">本周即将开始</div>
            <span class="card-panel-num">{{ stats.weekActivity }}</span>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
        <div class="card-panel">
          <div class="card-panel-icon-wrapper icon-people">
            <el-icon size="40"><UserFilled /></el-icon>
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">累计参与人次</div>
            <span class="card-panel-num">{{ stats.totalPeople }}</span>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
        <div class="card-panel">
          <div class="card-panel-icon-wrapper icon-my">
            <el-icon size="40"><Checked /></el-icon>
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">我的报名记录</div>
            <span class="card-panel-num">{{ stats.myReg }}</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :lg="16">
        <el-card class="box-card dashboard-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><DataAnalysis /></el-icon> 学术活动数据全景</span>
              <el-button link type="primary" @click="$router.push('/biz/statistics/index')">查看详情</el-button>
            </div>
          </template>
          <div class="chart-container-wrapper">
            <activity-statistics />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :lg="8">
        <el-card class="box-card dashboard-card quick-access" shadow="hover">
          <template #header>
             <div class="card-header">
              <span><el-icon><Pointer /></el-icon> 快捷导航</span>
            </div>
          </template>
          <div class="quick-actions">
            <div class="action-item" @click="$router.push('/biz/activity/market')">
              <span class="icon-box bg-blue"><el-icon><Search /></el-icon></span>
              <p>找活动</p>
            </div>
            <div class="action-item" @click="$router.push('/biz/registration/index')">
              <span class="icon-box bg-green"><el-icon><Ticket /></el-icon></span>
              <p>我的票夹</p>
            </div>
            <div class="action-item" @click="$router.push('/biz/activity/index')">
              <span class="icon-box bg-purple"><el-icon><EditPen /></el-icon></span>
              <p>发布活动</p>
            </div>
             <div class="action-item" @click="$router.push('/system/user/profile')">
              <span class="icon-box bg-orange"><el-icon><Setting /></el-icon></span>
              <p>个人设置</p>
            </div>
          </div>
        </el-card>

        <el-card class="box-card dashboard-card mt20" shadow="hover">
           <template #header>
             <div class="card-header">
              <span><el-icon><Bell /></el-icon> 最新公告</span>
              <el-tag size="small" type="danger">NEW</el-tag>
            </div>
          </template>
          <ul class="notice-list">
            <li v-for="item in noticeList" :key="item.noticeId" @click="handleNoticeClick(item)">
              <span class="notice-title">{{ item.noticeTitle }}</span>
              <span class="notice-time">{{ parseTime(item.createTime, '{m}-{d}') }}</span>
            </li>
            <li v-if="noticeList.length === 0" style="color: #999; text-align: center; padding: 20px;">
              暂无最新公告
            </li>
          </ul>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Index">
import { computed, ref, onMounted } from 'vue'
import useUserStore from '@/store/modules/user'
// 引入 API
import { getIndexData } from '@/api/biz/activity'
// 引入图标
import { Flag, Calendar, UserFilled, Checked, DataAnalysis, Pointer, Search, Ticket, EditPen, Setting, Bell } from '@element-plus/icons-vue'
import ActivityStatistics from '@/views/biz/statistics/index.vue'
import { parseTime } from '@/utils/ruoyi'
import defAva from '@/assets/images/profile.jpg'
import { ElMessageBox } from 'element-plus'

const userStore = useUserStore()
const roles = computed(() => userStore.roles)
const nickName = computed(() => userStore.nickName)
const avatar = computed(() => userStore.avatar || defAva)

// 响应式数据：核心指标
const stats = ref({
  totalActivity: 0,
  weekActivity: 0,
  totalPeople: 0,
  myReg: 0
})

// 响应式数据：公告列表
const noticeList = ref([])

// 计算问候语
const timeFix = computed(() => {
  const time = new Date()
  const hour = time.getHours()
  return hour < 9 ? '早上好' : hour <= 11 ? '上午好' : hour <= 13 ? '中午好' : hour < 20 ? '下午好' : '晚上好'
})

// 初始化加载数据
onMounted(() => {
  getIndexData().then(res => {
    const data = res.data || {}
    // 赋值指标 (增加默认值防止报错)
    stats.value = {
      totalActivity: data.totalActivity || 0,
      weekActivity: data.weekActivity || 0,
      totalPeople: data.totalPeople || 0,
      myReg: data.myReg || 0
    }
    // 赋值公告
    noticeList.value = data.notices || []
  }).catch(err => {
    console.error("加载首页数据失败", err)
  })
})

// 点击公告查看详情
function handleNoticeClick(item) {
  ElMessageBox.alert(item.noticeContent, item.noticeTitle, {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '知道了'
  })
}
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 20px;
  background-color: #f5f7fa; // 整体背景色偏灰，突出卡片

  // 1. Banner 区域样式
  .dashboard-banner {
    position: relative;
    width: 100%;
    height: 220px;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 25px;
    // 使用高质量学术背景图 (Unsplash 源)
    background: url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D') no-repeat center center;
    background-size: cover;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);

    // 添加深色遮罩，保证文字清晰度
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, rgba(24, 144, 255, 0.8) 0%, rgba(0, 0, 0, 0.5) 100%);
    }

    .banner-content {
      position: relative;
      z-index: 2;
      padding: 40px;
      color: #fff;

      .greeting {
        display: flex;
        align-items: center;

        .user-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 4px solid rgba(255, 255, 255, 0.3);
          margin-right: 25px;
        }

        .greeting-text {
          h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          p {
            margin: 10px 0 0;
            font-size: 16px;
            opacity: 0.9;
            &.subtitle {
              font-size: 14px;
              opacity: 0.7;
              margin-top: 5px;
            }
          }
        }
      }
    }
  }

  // 2. 核心指标卡片样式 (仿 Ant Design Pro 风格)
  .panel-group {
    margin-bottom: 25px;
    .card-panel-col {
      margin-bottom: 20px;
    }
    .card-panel {
      height: 108px;
      font-size: 12px;
      position: relative;
      overflow: hidden;
      color: #666;
      background: #fff;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      border: 1px solid #e6ebf5;
      transition: all 0.3s;
      cursor: pointer;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        .card-panel-icon-wrapper {
          color: #fff;
        }
        .icon-activity { background: #40c9c6; }
        .icon-date { background: #36a3f7; }
        .icon-people { background: #f4516c; }
        .icon-my { background: #f6ab40; }
      }

      .card-panel-icon-wrapper {
        float: left;
        margin: 14px 0 0 14px;
        padding: 16px;
        transition: all 0.3s ease-out;
        border-radius: 6px;
      }
      // 图标颜色
      .icon-activity { color: #40c9c6; }
      .icon-date { color: #36a3f7; }
      .icon-people { color: #f4516c; }
      .icon-my { color: #f6ab40; }

      .card-panel-description {
        float: right;
        font-weight: bold;
        margin: 26px 26px 26px 0;
        .card-panel-text {
          line-height: 18px;
          color: rgba(0, 0, 0, 0.45);
          font-size: 16px;
          margin-bottom: 12px;
        }
        .card-panel-num {
          font-size: 24px;
          color: #333;
        }
      }
    }
  }

  // 3. 通用卡片样式
  .dashboard-card {
    border: none;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 18px;
      font-weight: 600;
      color: #333;
      span {
        display: flex;
        align-items: center;
        i, svg { margin-right: 8px; color: #1890ff; }
      }
    }
  }

  // 统计图表容器微调
  .chart-container-wrapper {
    /* 强制覆盖原来组件里的样式，使其适应卡片 */
    :deep(.app-container) {
      padding: 0 !important;
    }
    :deep(.chart-wrapper) {
      margin-bottom: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
  }

  // 快捷入口样式
  .quick-access {
    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      .action-item {
        width: 48%;
        background: #f9fbfd;
        padding: 15px 10px;
        border-radius: 8px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
        margin-bottom: 15px;

        &:hover {
          background: #eef6fc;
          transform: scale(1.02);
        }

        .icon-box {
          display: inline-block;
          width: 40px;
          height: 40px;
          line-height: 40px;
          border-radius: 50%;
          color: #fff;
          font-size: 20px;
          margin-bottom: 8px;
          // 快捷键颜色
          &.bg-blue { background: linear-gradient(135deg, #1890ff, #69c0ff); }
          &.bg-green { background: linear-gradient(135deg, #52c41a, #95de64); }
          &.bg-purple { background: linear-gradient(135deg, #722ed1, #b37feb); }
          &.bg-orange { background: linear-gradient(135deg, #fa8c16, #ffc069); }
        }
        p {
          margin: 0;
          font-size: 14px;
          color: #555;
          font-weight: 500;
        }
      }
    }
  }

  // 通知列表样式
  .notice-list {
    list-style: none;
    padding: 0;
    margin: 0;
    li {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px dashed #eee;
      font-size: 14px;
      cursor: pointer;
      &:last-child { border-bottom: none; }
      &:hover .notice-title { color: #1890ff; }

      .notice-title {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-right: 20px;
        color: #555;
        position: relative;
        padding-left: 15px;
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #e8e8e8;
          border-radius: 50%;
        }
      }
      .notice-time {
        color: #999;
        font-size: 13px;
      }
    }
  }
  
  .mt20 { margin-top: 20px; }
}
</style>