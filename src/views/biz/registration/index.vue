<template>
  <div class="app-container ticket-container">
    <div class="ticket-header mb20">
      <div class="stat-box bg-blue">
        <div class="stat-icon"><el-icon><Ticket /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ validCount }}</div>
          <div class="stat-label">待参加活动</div>
        </div>
      </div>
      <div class="stat-box bg-green">
        <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ checkinCount }}</div>
          <div class="stat-label">已成功签到</div>
        </div>
      </div>
    </div>

    <div class="section-title" v-if="activeList.length > 0">
      <el-icon><Timer /></el-icon> 即将开始
    </div>
    
    <div class="ticket-list" v-loading="loading">
      <el-empty v-if="!loading && activeList.length === 0 && historyList.length === 0" description="暂无报名记录，快去活动大厅看看吧" />
      
      <div class="ticket-item" v-for="item in activeList" :key="item.regId">
        <div class="ticket-left">
          <div class="activity-type-tag" :class="getTypeClass(item.activityType)">
            {{ item.activityType === '1' ? '学术讲座' : '校园活动' }}
          </div>
          <h3 class="ticket-title" @click="toActivityDetail(item.activityId)">{{ item.activityName }}</h3>
          <div class="ticket-meta">
            <p><el-icon><Location /></el-icon> {{ item.location || '线上/待定' }}</p>
            <p><el-icon><Clock /></el-icon> {{ parseTime(item.startTime, '{m}月{d}日 {h}:{i}') }}</p>
          </div>
          <div class="ticket-speaker" v-if="item.speaker">
            <el-avatar :size="24" icon="UserFilled" class="speaker-avatar"></el-avatar>
            <span>主讲：{{ item.speaker }}</span>
          </div>
        </div>

        <div class="ticket-divider">
          <div class="half-circle top"></div>
          <div class="dashed-line"></div>
          <div class="half-circle bottom"></div>
        </div>

        <div class="ticket-right">
          <div class="status-area">
            <div v-if="item.status === '1'" class="status-queue">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>候补排队中...</span>
            </div>
            <div v-else class="status-valid">
              <span class="seat-label">入场凭证</span>
              <div class="qr-placeholder" @click="handleCheckin(item)">
                <el-icon size="32"><FullScreen /></el-icon>
                <span>扫码签到</span>
              </div>
            </div>
          </div>
          
          <div class="action-area">
             <el-button 
               v-if="['0','1'].includes(item.status)" 
               type="danger" 
               link 
               size="small"
               @click="handleCancel(item)"
             >取消报名</el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title mt30" v-if="historyList.length > 0">
      <el-icon><Clock /></el-icon> 历史记录
    </div>
    <div class="ticket-list history-list">
      <div class="ticket-item is-disabled" v-for="item in historyList" :key="item.regId">
        <div class="ticket-left">
           <h3 class="ticket-title">{{ item.activityName || '活动已归档' }}</h3>
           <div class="ticket-meta">
             <span class="reg-time">报名时间：{{ parseTime(item.createTime, '{y}-{m}-{d}') }}</span>
           </div>
        </div>
        <div class="ticket-right">
          <div v-if="item.status === '2'" class="action-column">
            <div class="stamp is-checkin">已核销</div>
            <el-button 
               type="primary" 
               link 
               icon="Star"
               size="small"
               style="margin-top: 5px;"
               @click="handleEval(item)"
             >去评价</el-button>
          </div>
          <div class="stamp is-cancel" v-else-if="item.status === '3'">已取消</div>
          <div class="stamp is-absent" v-else-if="item.status === '4'">缺席</div>
          <div class="stamp is-cancel" v-else>已结束</div>
        </div>
      </div>
    </div>

    <el-dialog title="现场签到" v-model="checkinOpen" width="400px" center append-to-body>
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="color: #666; margin-bottom: 15px;">请输入活动现场大屏幕上的 4 位签到码</p>
        <el-input 
          v-model="checkinToken" 
          placeholder="例如：A1B2" 
          maxlength="6"
          input-style="text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" size="large" @click="submitCheckin" style="width: 100%">确认签到</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog 
      title="写评价" 
      v-model="evalOpen" 
      width="500px" 
      center 
      append-to-body
      class="eval-dialog"
    >
      <div class="eval-content">
        <p class="eval-tip">您对“{{ currentActivityName }}”满意吗？</p>
        <div class="star-area">
          <el-rate 
            v-model="evalForm.score" 
            size="large" 
            allow-half 
            show-text
            :texts="['非常不满意', '不满意', '一般', '满意', '非常满意']"
            :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
          />
        </div>
        <el-input 
          v-model="evalForm.comment" 
          type="textarea" 
          :rows="4" 
          placeholder="写点什么吧，您的反馈对我们很重要..." 
          maxlength="200"
          show-word-limit
          class="eval-input"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="evalOpen = false">取消</el-button>
          <el-button type="primary" @click="submitEval" :disabled="!evalForm.score">提交评价</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Registration">
// 引入必要的 API，包括原有的取消报名和新增的评价
import { listRegistration, checkinActivity, cancelRegistration } from "@/api/biz/registration";
import { addEvaluation } from "@/api/biz/evaluation"; // 【新增】
import { parseTime } from "@/utils/ruoyi";
import { getCurrentInstance, ref, computed } from 'vue';
import { Ticket, CircleCheck, Timer, Location, Clock, Loading, FullScreen, Star, UserFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const { proxy } = getCurrentInstance();
const router = useRouter();

const loading = ref(true);
const regList = ref([]);
const checkinOpen = ref(false);
const checkinToken = ref('');
const currentActivityId = ref(null);

// 评价相关变量 【新增】
const evalOpen = ref(false);
const currentActivityName = ref('');
const evalForm = ref({
  score: 5,
  comment: '',
  activityId: null
});

// 统计数据
const validCount = computed(() => regList.value.filter(i => i.status === '0' || i.status === '1').length);
const checkinCount = computed(() => regList.value.filter(i => i.status === '2').length);

// 分组：待参加 vs 历史
const activeList = computed(() => {
  return regList.value.filter(item => ['0', '1'].includes(item.status));
});
const historyList = computed(() => {
  return regList.value.filter(item => !['0', '1'].includes(item.status));
});

function getList() {
  loading.value = true;
  listRegistration().then(res => {
    regList.value = res.rows || [];
    loading.value = false;
  });
}

function getTypeClass(type) {
  return type === '1' ? 'type-blue' : 'type-orange';
}

function toActivityDetail(id) {
  // 这里可以写跳转逻辑，比如 router.push('/biz/activity/detail/' + id)
}

function handleCheckin(row) {
  currentActivityId.value = row.activityId;
  checkinToken.value = '';
  checkinOpen.value = true;
}

function submitCheckin() {
  if (!checkinToken.value) {
    proxy.$modal.msgError("请输入签到码");
    return;
  }
  checkinActivity({ 
    activityId: currentActivityId.value, 
    remark: checkinToken.value 
  }).then(res => {
    proxy.$modal.msgSuccess(res.msg);
    checkinOpen.value = false;
    getList();
  });
}

// 【保留原有】取消报名逻辑
function handleCancel(row) {
  proxy.$modal.confirm('确认放弃该活动的报名名额吗？此操作不可撤销。').then(() => {
    return cancelRegistration(row.regId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("已取消报名");
  }).catch(() => {});
}

// 【新增】打开评价弹窗逻辑
function handleEval(row) {
  currentActivityName.value = row.activityName;
  evalForm.value = {
    score: 5,
    comment: '',
    activityId: row.activityId
  };
  evalOpen.value = true;
}

// 【新增】提交评价逻辑
function submitEval() {
  if (evalForm.value.score === 0) {
    proxy.$modal.msgError("请点击星星打分");
    return;
  }
  addEvaluation(evalForm.value).then(res => {
    proxy.$modal.msgSuccess("评价成功！");
    evalOpen.value = false;
    // 评价成功后可以刷新列表，或者依然保留按钮（取决于需求，这里暂不强制刷新隐藏）
  });
}

getList();
</script>

<style scoped lang="scss">
.ticket-container {
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
  padding: 20px;
}

/* 1. 顶部统计 */
.ticket-header {
  display: flex;
  gap: 20px;
  
  .stat-box {
    flex: 1;
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    
    &.bg-blue .stat-icon { background: rgba(24, 144, 255, 0.1); color: #1890ff; }
    &.bg-green .stat-icon { background: rgba(82, 196, 26, 0.1); color: #52c41a; }
    
    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-right: 15px;
    }
    
    .stat-info {
      .stat-num { font-size: 24px; font-weight: bold; color: #333; line-height: 1.2; }
      .stat-label { font-size: 13px; color: #999; }
    }
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 2. 票券样式核心 */
.ticket-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ticket-item {
  background: #fff;
  border-radius: 12px;
  display: flex;
  height: 140px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  }

  /* 左侧信息 */
  .ticket-left {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    
    .activity-type-tag {
      position: absolute;
      top: 0;
      left: 0;
      padding: 4px 12px;
      font-size: 12px;
      border-bottom-right-radius: 12px;
      color: #fff;
      &.type-blue { background: #1890ff; }
      &.type-orange { background: #fa8c16; }
    }
    
    .ticket-title {
      margin: 10px 0 10px;
      font-size: 18px;
      color: #333;
      cursor: pointer;
      &:hover { color: #1890ff; }
    }
    
    .ticket-meta {
      color: #666;
      font-size: 13px;
      display: flex;
      gap: 20px;
      p { margin: 0; display: flex; align-items: center; gap: 5px; }
    }
    
    .ticket-speaker {
      margin-top: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #999;
      .speaker-avatar { background: #f0f2f5; color: #ccc; }
    }
  }

  /* 中间分割线 */
  .ticket-divider {
    width: 20px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .dashed-line {
      height: 80%;
      border-left: 2px dashed #e8e8e8;
    }
    
    .half-circle {
      position: absolute;
      width: 20px;
      height: 20px;
      background: #f5f7fa; /* 与背景色一致 */
      border-radius: 50%;
      left: 0;
      &.top { top: -10px; }
      &.bottom { bottom: -10px; }
    }
  }

  /* 右侧状态区 */
  .ticket-right {
    width: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
    background: #fff;
    
    .status-area {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .qr-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #1890ff;
      cursor: pointer;
      gap: 5px;
      font-size: 12px;
      &:hover { opacity: 0.8; }
    }
    
    .status-queue {
      color: #fa8c16;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      font-size: 13px;
    }
    
    .seat-label {
      font-size: 12px;
      color: #999;
      margin-bottom: 5px;
    }
    
    .action-area {
      height: 30px;
    }
  }
}

/* 3. 历史记录样式 (置灰) */
.history-list {
  opacity: 1; /* 改回1，否则评价按钮看不清 */
  .ticket-item {
    height: auto; /* 高度自动，适应内容 */
    min-height: 100px;
    background: #fafafa;
    border: 1px solid #eee;
    box-shadow: none;
    
    .ticket-title { font-size: 15px; color: #666; margin: 0 0 5px 0; }
    .ticket-left { justify-content: center; }
  }
  
  /* 右侧列布局 */
  .action-column {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .stamp {
    border: 2px solid;
    padding: 2px 8px;
    transform: rotate(-10deg);
    font-weight: bold;
    font-size: 12px;
    border-radius: 4px;
    margin-bottom: 8px;
    
    &.is-checkin { color: #52c41a; border-color: #52c41a; }
    &.is-cancel { color: #999; border-color: #999; }
    &.is-absent { color: #ff4d4f; border-color: #ff4d4f; }
  }
}

.mb20 { margin-bottom: 20px; }
.mt30 { margin-top: 30px; }

/* 评价弹窗样式 */
.eval-content {
  text-align: center;
  padding: 10px 20px;
}
.eval-tip { font-size: 16px; color: #333; margin-bottom: 20px; }
.star-area { margin-bottom: 20px; display: flex; justify-content: center; }
.eval-input { margin-top: 10px; }

/* 旋转动画 */
.loading-icon {
  animation: rotate 2s linear infinite;
}
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>