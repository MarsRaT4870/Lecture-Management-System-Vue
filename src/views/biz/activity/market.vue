<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="活动名称" prop="title">
        <el-input v-model="queryParams.title" placeholder="搜索感兴趣的活动..." clearable @keyup.enter.native="handleQuery"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="20" v-loading="loading">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in activityList" :key="item.activityId" style="margin-bottom: 20px;">
        <el-card shadow="hover" class="activity-card">
          <div slot="header" class="clearfix">
            <span class="card-title">{{ item.title }}</span>
            <el-tag size="mini" :type="statusType(item)" style="float: right">{{ statusText(item) }}</el-tag>
          </div>
          <div class="card-body">
            <p><i class="el-icon-user"></i> 主讲人：{{ item.speaker }}</p>
            <p><i class="el-icon-location-information"></i> 地点：{{ item.location }}</p>
            <p><i class="el-icon-time"></i> 时间：{{ parseTime(item.startTime, '{y}-{m}-{d} {h}:{i}') }}</p>
            <p><i class="el-icon-s-custom"></i> 名额：<span style="color: #ff9800">{{ item.maxPeople || '不限' }}</span> 人</p>
            
            <div class="card-desc">
              {{ item.description || '暂无简介' }}
            </div>
          </div>
          
          <div class="bottom clearfix" style="text-align: center; margin-top: 15px;">
             <el-button 
               v-if="item.status === '0'" 
               type="primary" 
               round 
               :loading="btnLoading === item.activityId"
               @click="handleJoin(item)">
               立即报名
             </el-button>
             <el-button v-else type="info" round disabled>已结束</el-button>
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

<script>
import { listActivity } from "@/api/biz/activity";
import { addRegistration } from "@/api/biz/registration";

export default {
  name: "ActivityMarket",
  data() {
    return {
      loading: true,
      activityList: [],
      total: 0,
      showSearch: true,
      queryParams: {
        pageNum: 1,
        pageSize: 12, // 卡片模式每页显示12个比较好看
        title: null,
        status: null // 可以默认查开启的，也可以全查
      },
      // 控制按钮加载状态
      btnLoading: null 
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listActivity(this.queryParams).then(response => {
        this.activityList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    // 处理报名逻辑
    handleJoin(activity) {
      const confirmText = `确认要报名参加活动【${activity.title}】吗？`;
      
      this.$modal.confirm(confirmText).then(() => {
        this.btnLoading = activity.activityId; // 按钮转圈
        
        // 构造报名数据 (后端会自动取当前用户ID，只需传活动ID)
        const data = {
          activityId: activity.activityId
        };

        return addRegistration(data);
      }).then(() => {
        this.$modal.msgSuccess("恭喜您，报名成功！");
        this.btnLoading = null;
      }).catch((err) => {
        // 捕获错误（比如重复报名、人数已满），停止转圈
        this.btnLoading = null;
        // 注意：若依的 request.js 会自动弹出错误提示，这里不需要再弹
      });
    },
    // 辅助显示状态颜色
    statusType(item) {
      if (item.status === '0') return 'success';
      return 'info';
    },
    // 辅助显示状态文字
    statusText(item) {
       if (item.status === '0') return '报名中';
       return '已结束';
    }
  }
};
</script>

<style scoped>
.card-title {
  font-weight: bold;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  max-width: 70%;
}
.card-body p {
  margin: 5px 0;
  color: #606266;
  font-size: 14px;
}
.card-desc {
  margin-top: 10px;
  height: 40px; /* 固定高度 */
  overflow: hidden;
  color: #909399;
  font-size: 12px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2; /* 只显示两行 */
}
</style>