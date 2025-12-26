<template>
  <div class="app-container credit-container">
    
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" v-hasRole="['admin']">
      <el-form-item label="学生姓名" prop="userName">
        <el-input v-model="queryParams.userName" placeholder="请输入姓名" clearable @keyup.enter="handleQuery"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <div v-if="!isAdmin" class="cert-wall">
      <div class="cert-summary bg-gradient">
        <div class="summary-item">
          <div class="num">{{ totalCredit }}</div>
          <div class="label">累计学分</div>
        </div>
        <div class="summary-item">
          <div class="num">{{ creditList.length }}</div>
          <div class="label">获得证书</div>
        </div>
      </div>

      <div class="cert-grid" v-loading="loading">
        <el-empty v-if="creditList.length === 0" description="暂无证书，快去参加活动吧" />
        
        <div class="cert-card" v-for="item in creditList" :key="item.creditId" @click="handleViewCert(item)">
          <div class="cert-border">
            <div class="cert-header">
              <el-icon color="#DAA520"><Trophy /></el-icon> 荣誉证书
            </div>
            <div class="cert-body">
              <div class="cert-name">{{ item.userName }}</div>
              <div class="cert-text">
                在 <span class="highlight">《{{ item.activityName }}》</span> 活动中表现优异，完成课程要求。
              </div>
              <div class="cert-footer">
                <div class="cert-no">NO.{{ item.certificateNo }}</div>
                <div class="cert-seal">教务处</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
       <el-table v-loading="loading" :data="creditList">
          <el-table-column label="姓名" prop="userName" />
          <el-table-column label="学院" prop="deptName" />
          <el-table-column label="活动主题" prop="activityName" />
          <el-table-column label="学分" prop="creditVal" />
          <el-table-column label="证书编号" prop="certificateNo" />
          <el-table-column label="发放时间" prop="grantTime" width="180">
            <template #default="scope">{{ parseTime(scope.row.grantTime) }}</template>
          </el-table-column>
       </el-table>
       <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </div>

    <el-dialog v-model="certOpen" width="600px" custom-class="cert-dialog" :show-close="false" append-to-body>
      <div class="paper-cert" id="printArea">
        <div class="paper-border">
           <div class="paper-logo">
             <el-icon size="60" color="#c0392b"><Stamp /></el-icon>
           </div>
           <h1 class="paper-title">荣誉证书</h1>
           <h2 class="paper-subtitle">CERTIFICATE OF HONOR</h2>
           
           <div class="paper-content">
             <p class="user-line">授予：<span class="name">{{ currentCert.userName }}</span> 同学</p>
             <p class="text-line">
               鉴于您在 <span class="act-name">“{{ currentCert.activityName }}”</span> 
               活动中积极参与，表现优异，特发此证，以资鼓励。
             </p>
             <p class="credit-line">计入第二课堂学分：<strong>{{ currentCert.creditVal }} 分</strong></p>
           </div>
           
           <div class="paper-footer">
             <div class="date">{{ parseTime(currentCert.grantTime, '{y}年{m}月{d}日') }}</div>
             <div class="org">高校教务处</div>
             <div class="seal-circle">
                <div class="seal-inner">教务处专用章</div>
             </div>
           </div>
           
           <div class="paper-no">编号：{{ currentCert.certificateNo }}</div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <el-button type="primary" round @click="certOpen = false">关闭预览</el-button>
        <el-button round @click="handlePrint">打印/保存</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script setup name="Credit">
import { listCredit } from "@/api/biz/credit";
import { getCurrentInstance, ref, computed } from 'vue';
import { parseTime } from "@/utils/ruoyi";
import { Trophy, Stamp } from '@element-plus/icons-vue';
// 假设有个简单的判断管理员的方法，或者直接根据角色判断
// 这里简单演示：如果你有 admin 权限字符就是管理员，否则是学生
// 实际请用 useUserStore 或 v-hasRole 判断

const { proxy } = getCurrentInstance();

const creditList = ref([]);
const loading = ref(true);
const total = ref(0);
const isAdmin = ref(false); // ⚠️ 注意：实际项目中请用权限判断 proxy.$auth.hasRole("admin")

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  userName: null
});

const certOpen = ref(false);
const currentCert = ref({});

const totalCredit = computed(() => {
  return creditList.value.reduce((sum, item) => sum + item.creditVal, 0).toFixed(1);
});

function getList() {
  loading.value = true;
  // 模拟判断权限，实际请根据你的登录角色
  // isAdmin.value = proxy.$auth.hasRole("admin"); 
  
  listCredit(queryParams.value).then(res => {
    creditList.value = res.rows;
    total.value = res.total;
    loading.value = false;
  });
}

function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

function resetQuery() {
  proxy.resetForm("queryForm");
  handleQuery();
}

function handleViewCert(item) {
  currentCert.value = item;
  certOpen.value = true;
}

function handlePrint() {
  window.print();
}

getList();
</script>

<style scoped lang="scss">
.credit-container {
  min-height: calc(100vh - 84px);
  background: #f0f2f5;
  padding: 20px;
}

/* 顶部汇总卡 */
.cert-summary {
  display: flex;
  justify-content: space-around;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
  color: #fff;
  
  &.bg-gradient {
    background: linear-gradient(135deg, #1c2438 0%, #495060 100%); /* 黑金风格 */
  }
  
  .summary-item {
    text-align: center;
    .num { font-size: 40px; font-weight: bold; font-family: 'Georgia', serif; }
    .label { font-size: 14px; opacity: 0.8; margin-top: 5px; }
  }
}

/* 证书墙 */
.cert-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.cert-card {
  background: #fff;
  height: 200px;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: transform 0.3s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  }
  
  .cert-border {
    border: 2px solid #DAA520; /* 金色边框 */
    height: 100%;
    border-radius: 4px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    position: relative;
    background: #fffdf5; /* 淡淡的米黄色 */
  }
  
  .cert-header {
    color: #DAA520;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 15px;
  }
  
  .cert-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333; }
  .cert-text { font-size: 13px; color: #666; line-height: 1.5; flex: 1; }
  .highlight { color: #c0392b; font-weight: bold; }
  
  .cert-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 12px;
    color: #999;
    
    .cert-seal {
      width: 40px; height: 40px;
      border: 2px solid #c0392b;
      border-radius: 50%;
      color: #c0392b;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px;
      transform: rotate(-20deg);
      opacity: 0.8;
    }
  }
}

/* 弹窗中的大证书样式 (拟物化) */
.paper-cert {
  background: #fff;
  padding: 20px;
  color: #333;
  font-family: "SimSun", "Songti SC", serif; /* 宋体，更有证书感 */
  
  .paper-border {
    border: 10px double #DAA520;
    padding: 40px;
    position: relative;
    text-align: center;
    background: url('data:image/svg+xml;base64,...') center/cover; /* 可选底纹 */
  }
  
  .paper-logo { margin-bottom: 10px; }
  .paper-title { font-size: 36px; color: #c0392b; margin: 0; letter-spacing: 5px; }
  .paper-subtitle { font-size: 12px; color: #999; margin-bottom: 40px; letter-spacing: 2px; }
  
  .paper-content {
    text-align: left;
    font-size: 18px;
    line-height: 2;
    margin-bottom: 50px;
    
    .user-line .name { border-bottom: 1px solid #333; padding: 0 10px; font-weight: bold; font-size: 22px; }
    .text-line .act-name { font-weight: bold; }
  }
  
  .paper-footer {
    text-align: right;
    position: relative;
    margin-right: 20px;
    
    .org { font-size: 20px; font-weight: bold; margin-top: 10px; }
    
    /* 公章 CSS 画法 */
    .seal-circle {
      position: absolute;
      right: 0;
      top: -20px;
      width: 100px;
      height: 100px;
      border: 3px solid #c0392b;
      border-radius: 50%;
      color: #c0392b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
      transform: rotate(-15deg);
      opacity: 0.8;
      pointer-events: none;
      
      .seal-inner {
        width: 80px; height: 80px;
        border: 1px solid #c0392b;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
      }
    }
  }
  
  .paper-no {
    position: absolute;
    bottom: 5px;
    left: 10px;
    font-size: 10px;
    color: #ccc;
    font-family: sans-serif;
  }
}
</style>