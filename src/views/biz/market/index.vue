<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="关键字" prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="搜索活动主题 / 主讲人"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="类型" prop="activityType">
          <el-select v-model="queryParams.activityType" placeholder="全部类型" clearable style="width: 140px">
            <el-option label="学术讲座" value="1" />
            <el-option label="校园活动" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20" class="mt20" v-loading="loading">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in activityList" :key="item.activityId" class="mb20">
        <el-card :body-style="{ padding: '0px' }" class="activity-card" shadow="hover" @click="handleDetail(item)">
          <div class="card-cover-wrapper">
            <div class="card-cover-img" :style="{ backgroundImage: `url(${getCoverImage(item)})` }"></div>
            <div class="card-cover-mask">
              <div class="card-badges">
                <el-tag :type="item.activityType === '1' ? '' : 'warning'" effect="dark" class="glass-tag">
                  {{ item.activityType === '1' ? '学术讲座' : '校园活动' }}
                </el-tag>
                <el-tag v-if="item.status === '2'" type="danger" effect="dark" round>已结束</el-tag>
                <el-tag v-else-if="isExpired(item)" type="info" effect="dark" round>报名截止</el-tag>
                <el-tag v-else type="success" effect="dark" round>报名中</el-tag>
              </div>
              <h3 class="card-title" :title="item.title">{{ item.title }}</h3>
            </div>
          </div>

          <div class="card-content">
            <div class="info-item">
              <el-icon class="mr5"><User /></el-icon>
              <span class="text-truncate" :title="item.speaker">
                主讲：{{ item.speaker }} 
                <span v-if="item.speakerTitle" class="text-muted text-xs">({{ item.speakerTitle }})</span>
              </span>
            </div>
            <div class="info-item">
              <el-icon class="mr5"><Clock /></el-icon>
              <span>{{ parseTime(item.startTime, '{m}-{d} {h}:{i}') }}</span>
            </div>
            <div class="info-item">
              <el-icon class="mr5"><Location /></el-icon>
              <span class="text-truncate" :title="item.location">{{ item.location }}</span>
            </div>
            <div class="divider"></div>
            <div class="card-footer">
              <span class="limit-info text-muted">
                <el-icon><UserFilled /></el-icon>
                限额: {{ item.maxPeople === 0 ? '不限' : item.maxPeople + '人' }}
              </span>
              <div class="actions">
                <el-button link type="primary" @click.stop="handleDetail(item)">详情</el-button>
                <el-button 
                  type="primary" 
                  size="small" 
                  round 
                  :disabled="isBtnDisabled(item)"
                  :plain="isBtnDisabled(item)"
                  @click.stop="handleApply(item.activityId)"
                >
                  {{ getBtnText(item) }}
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="24" v-if="!loading && activityList.length === 0">
        <el-empty description="暂无符合条件的活动，换个词试试？" />
      </el-col>
    </el-row>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog :title="detailForm.title" v-model="detailOpen" width="600px" append-to-body destroy-on-close>
      <div class="detail-container">
        <div class="detail-banner" :style="{ backgroundImage: `url(${getCoverImage(detailForm)})` }">
           <div class="detail-mask">
             <div class="detail-meta">
               <span class="meta-item"><el-icon><Timer /></el-icon> {{ parseTime(detailForm.startTime) }} ~ {{ parseTime(detailForm.endTime) }}</span>
               <span class="meta-item"><el-icon><MapLocation /></el-icon> {{ detailForm.location }}</span>
             </div>
           </div>
        </div>
        <div class="detail-body mt20">
           <el-descriptions :column="1" border>
             <el-descriptions-item label="主讲人">{{ detailForm.speaker }} <el-tag size="small" v-if="detailForm.speakerTitle">{{ detailForm.speakerTitle }}</el-tag></el-descriptions-item>
             <el-descriptions-item label="申报主体">
                <span v-if="detailForm.applicantType === '1'">校内部门</span>
                <span v-else-if="detailForm.applicantType === '3'">教师个人</span>
                <span v-else>其他</span>
             </el-descriptions-item>
             <el-descriptions-item label="当前报名">{{ detailForm.regCount || 0 }} 人</el-descriptions-item>
             <el-descriptions-item label="报名截止">
               <span class="text-danger">{{ parseTime(detailForm.regDeadline) }}</span>
             </el-descriptions-item>
           </el-descriptions>
           <div class="desc-box mt20">
             <h4>活动简介</h4>
             <p class="desc-text">{{ detailForm.description || '暂无详细介绍' }}</p>
           </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailOpen = false">关 闭</el-button>
          <el-button 
            type="primary" 
            :disabled="isBtnDisabled(detailForm)" 
            @click="handleApply(detailForm.activityId)"
          >
            {{ getBtnText(detailForm) }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Market">
import { listActivity, getActivity } from "@/api/biz/activity";
import { applyActivity, listRegistration } from "@/api/biz/registration"; 
import { parseTime } from "@/utils/ruoyi";
import { getCurrentInstance, reactive, ref, toRefs } from 'vue';
import { Search, Refresh, User, Clock, Location, UserFilled, Timer, MapLocation } from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'

const { proxy } = getCurrentInstance();
const userStore = useUserStore();

const activityList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const detailOpen = ref(false);
const detailForm = ref({});
const myRegIds = ref([]); 

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 8, 
    title: null,
    activityType: null,
    visible: '1' // 【重要】强制只显示可见活动（过滤掉已归档）
  }
});

const { queryParams } = toRefs(data);

const lectureImages = [
  'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=800', 
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800', 
  'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?q=80&w=800', 
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800', 
  'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=800'  
];
const activityImages = [
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800', 
  'https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=800', 
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800', 
  'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?q=80&w=800', 
  'https://images.unsplash.com/photo-1526976668912-1a811878dd37?q=80&w=800'  
];

function getCoverImage(item) {
  if (!item || !item.activityId) return lectureImages[0];
  const id = item.activityId;
  return item.activityType === '1' ? lectureImages[id % lectureImages.length] : activityImages[id % activityImages.length];
}

function getList() {
  loading.value = true;
  listActivity(queryParams.value).then(response => {
    activityList.value = response.rows;
    total.value = response.total;
    loading.value = false;
    getMyRegistrationList();
  });
}

function getMyRegistrationList() {
  if (!userStore.userId) return;
  listRegistration({ userId: userStore.userId }).then(res => {
    myRegIds.value = res.rows.map(item => item.activityId);
  });
}

function handleQuery() { queryParams.value.pageNum = 1; getList(); }
function resetQuery() { proxy.resetForm("queryForm"); handleQuery(); }

function isExpired(item) {
  if (!item.regDeadline) return false;
  return new Date(item.regDeadline) < new Date();
}

function getBtnText(item) {
  if (myRegIds.value.includes(item.activityId)) return "已报名";
  if (item.status === '2') return '已结束';
  if (isExpired(item)) return '报名截止';
  if (item.maxPeople > 0 && item.regCount >= item.maxPeople) return "名额已满";
  return '立即报名';
}

function isBtnDisabled(item) {
  if (myRegIds.value.includes(item.activityId)) return true;
  if (item.status === '2') return true;
  if (isExpired(item)) return true;
  if (item.maxPeople > 0 && item.regCount >= item.maxPeople) return true;
  return false;
}

function handleDetail(item) {
  detailForm.value = { ...item };
  detailOpen.value = true;
}

function handleApply(id) {
  proxy.$modal.confirm('确认报名参加该活动吗?').then(() => {
    return applyActivity({ activityId: id });
  }).then(res => {
    const isQueue = res.msg.includes("候补");
    proxy.$alert(res.msg, isQueue ? '进入候补' : '报名成功', {
      confirmButtonText: '确定',
      type: isQueue ? 'warning' : 'success',
      callback: () => { detailOpen.value = false; getList(); }
    });
  }).catch(() => {});
}

getList();
</script>

<style scoped lang="scss">
.app-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
}
.search-card { border-radius: 8px; border: none; }
.activity-card {
  border: none; border-radius: 12px; transition: all 0.4s; overflow: hidden; cursor: pointer;
  &:hover {
    transform: translateY(-8px); box-shadow: 0 16px 32px rgba(0,0,0,0.15) !important;
    .card-cover-img { transform: scale(1.1); }
  }
  .card-cover-wrapper { height: 140px; position: relative; overflow: hidden; }
  .card-cover-img { width: 100%; height: 100%; background-size: cover; background-position: center; transition: transform 0.6s ease; }
  .card-cover-mask {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%);
    padding: 16px; display: flex; flex-direction: column; justify-content: space-between;
  }
  .card-badges { display: flex; gap: 5px; .glass-tag { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(4px); border: none; color: #fff; } }
  .card-title { font-size: 18px; font-weight: bold; margin: 0; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
  .card-content {
    padding: 16px; background: #fff;
    .info-item {
      display: flex; align-items: center; margin-bottom: 10px; color: #606266; font-size: 14px;
      .text-muted { color: #909399; } .text-truncate { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    }
    .divider { height: 1px; background: #f0f2f5; margin: 12px 0; }
    .card-footer { display: flex; justify-content: space-between; align-items: center; .limit-info { font-size: 12px; display: flex; align-items: center; gap: 4px; } .actions { display: flex; align-items: center; gap: 10px; } }
  }
}
.mr5 { margin-right: 5px; } .mt20 { margin-top: 20px; }
.detail-container {
  .detail-banner {
    height: 160px; border-radius: 8px; position: relative; overflow: hidden; background-size: cover; background-position: center;
    .detail-mask { width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; }
    .detail-meta { color: #fff; font-size: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px; .meta-item { display: flex; align-items: center; gap: 8px; font-weight: 500; } }
  }
  .desc-box {
    background: #f8f9fa; padding: 20px; border-radius: 8px;
    h4 { margin: 0 0 15px; border-left: 4px solid #1890ff; padding-left: 12px; font-size: 16px; color: #303133; }
    .desc-text { color: #606266; line-height: 1.8; font-size: 14px; white-space: pre-wrap; text-align: justify; }
  }
}
</style>