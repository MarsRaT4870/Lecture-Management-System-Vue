<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryFormRef" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="活动名称" prop="title">
        <el-input 
          v-model="queryParams.title" 
          placeholder="搜索感兴趣的活动..." 
          clearable 
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="20" v-loading="loading">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in activityList" :key="item.activityId" style="margin-bottom: 20px;">
        <el-card shadow="hover" class="activity-card">
          <template #header>
            <div class="clearfix">
              <span class="card-title" :title="item.title">{{ item.title }}</span>
              <el-tag size="small" :type="statusType(item)" style="float: right">{{ statusText(item) }}</el-tag>
            </div>
          </template>
          
          <div class="card-body">
            <p><el-icon><User /></el-icon> 主讲人：{{ item.speaker }}</p>
            <p><el-icon><Location /></el-icon> 地点：{{ item.location }}</p>
            <p><el-icon><Timer /></el-icon> 时间：{{ parseTime(item.startTime, '{y}-{m}-{d} {h}:{i}') }}</p>
            <p>
              <el-icon><UserFilled /></el-icon> 名额：
              <span style="color: #ff9800">{{ item.maxPeople || '不限' }}</span> 人
            </p>
            <div class="card-desc" :title="item.description">
              {{ item.description || '暂无简介' }}
            </div>
          </div>
          
          <div class="bottom clearfix" style="text-align: center; margin-top: 15px;">
             <el-button v-if="item.status !== '0'" type="info" round disabled>已结束</el-button>
             
             <div v-else>
               <el-button 
                 v-if="myRegIds.includes(item.activityId)" 
                 type="success" 
                 plain
                 round 
                 disabled>
                 <el-icon><Select /></el-icon> 已报名
               </el-button>

               <el-button 
                 v-else
                 type="primary" 
                 round 
                 :loading="btnLoading === item.activityId"
                 @click="handleJoin(item)">
                 立即报名
               </el-button>
             </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script setup name="ActivityMarket">
import { listActivity } from "@/api/biz/activity";
// 【新增】引入查询报名列表的接口，用来查"我报了啥"
import { addRegistration, listRegistration } from "@/api/biz/registration";
import { getCurrentInstance, reactive, ref, toRefs } from 'vue';

const { proxy } = getCurrentInstance();

const activityList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const btnLoading = ref(null);

// 【新增】存储当前用户已报名的所有活动ID
const myRegIds = ref([]);

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 12,
    title: null,
    status: '0' 
  }
});

const { queryParams } = toRefs(data);

/** 1. 查询活动列表 */
function getList() {
  loading.value = true;
  listActivity(queryParams.value).then(response => {
    activityList.value = response.rows;
    total.value = response.total;
    
    // 【关键】活动查完后，马上查一下"我的报名记录"来比对状态
    getMyRegistrations();
    
    loading.value = false;
  });
}

/** 2. 【新增】查询我的报名记录 */
function getMyRegistrations() {
  // 因为我们在后端写过：如果是学生，不传参数默认就查自己的
  listRegistration().then(res => {
    // 提取出所有报过的 activityId，存到一个数组里
    myRegIds.value = res.rows.map(item => item.activityId);
  });
}

/** 搜索按钮 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 立即报名逻辑 */
function handleJoin(activity) {
  const confirmText = `确认要报名参加活动【${activity.title}】吗？`;
  
  proxy.$modal.confirm(confirmText).then(() => {
    btnLoading.value = activity.activityId;
    return addRegistration({ activityId: activity.activityId });
  }).then(() => {
    proxy.$modal.msgSuccess("恭喜您，报名成功！");
    // 【关键】报名成功后，手动把这个ID加到已报名数组里，按钮立马变绿
    myRegIds.value.push(activity.activityId);
    btnLoading.value = null; 
  }).catch((err) => {
    btnLoading.value = null;
    // 如果后端报"重复报名"的错，顺便也刷新一下状态，把按钮置灰
    getMyRegistrations();
  });
}

function statusType(item) {
  if (item.status === '0') return 'success';
  return 'info';
}

function statusText(item) {
   if (item.status === '0') return '报名中';
   return '已结束';
}

getList();
</script>

<style scoped>
.activity-card {
  transition: all 0.3s;
}
.activity-card:hover {
  transform: translateY(-5px);
}
.card-title {
  font-weight: bold;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  max-width: 70%;
  vertical-align: middle;
}
.card-body p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
  display: flex;
  align-items: center;
}
.card-body p .el-icon {
  margin-right: 8px;
  font-size: 16px;
}
.card-desc {
  margin-top: 15px;
  height: 40px; 
  line-height: 20px;
  overflow: hidden;
  color: #909399;
  font-size: 12px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2; 
}
</style>