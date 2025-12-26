<template>
  <div class="app-container message-container">
    <div class="message-header">
      <div class="header-left">
        <span class="title">消息中心</span>
        <el-tag type="danger" effect="dark" round v-if="unreadNum > 0" class="ml-2">
          {{ unreadNum }} 条未读
        </el-tag>
      </div>
      <div class="header-right">
        <el-button icon="Check" plain @click="handleReadAll" :disabled="unreadNum === 0">全部已读</el-button>
        <el-button icon="Refresh" circle @click="getList" />
      </div>
    </div>

    <el-tabs v-model="activeTab" class="message-tabs" @tab-click="handleTabClick">
      <el-tab-pane label="全部消息" name="all"></el-tab-pane>
      <el-tab-pane label="未读消息" name="unread"></el-tab-pane>
      <el-tab-pane label="已读消息" name="read"></el-tab-pane>
    </el-tabs>

    <div class="message-list" v-loading="loading">
      <el-empty v-if="msgList.length === 0" description="暂无消息通知" />
      
      <transition-group name="list">
        <div 
          class="msg-card" 
          v-for="item in msgList" 
          :key="item.messageId"
          :class="{ 'is-read': item.readFlag === '1' }"
          @click="handleRead(item)"
        >
          <div class="msg-icon" :class="getIconClass(item.type)">
             <el-icon v-if="item.type === '1'"><Bell /></el-icon>
             <el-icon v-else><Calendar /></el-icon>
          </div>
          
          <div class="msg-content">
            <div class="msg-top">
              <span class="msg-title">{{ item.title }}</span>
              <span class="msg-time">{{ parseTime(item.createTime) }}</span>
            </div>
            <div class="msg-body">
              {{ item.content }}
            </div>
          </div>

          <div class="msg-action">
             <div class="dot" v-if="item.readFlag === '0'" title="未读"></div>
             <el-button 
               v-else 
               type="danger" 
               link 
               icon="Delete" 
               @click.stop="handleDelete(item)"
             ></el-button>
          </div>
        </div>
      </transition-group>
    </div>
    
    <pagination 
      v-show="total>0" 
      :total="total" 
      v-model:page="queryParams.pageNum" 
      v-model:limit="queryParams.pageSize" 
      @pagination="getList" 
    />
  </div>
</template>

<script setup name="Message">
import { listMessage, readMessage, readAllMessage, delMessage, getUnreadCount } from "@/api/biz/message";
import { getCurrentInstance, ref, onMounted } from 'vue';
import { parseTime } from "@/utils/ruoyi";
import { Bell, Calendar, Check, Refresh, Delete } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance();

const msgList = ref([]);
const loading = ref(true);
const total = ref(0);
const activeTab = ref('all');
const unreadNum = ref(0);

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  readFlag: null // null=all, 0=unread, 1=read
});

function getList() {
  loading.value = true;
  listMessage(queryParams.value).then(res => {
    msgList.value = res.rows;
    total.value = res.total;
    loading.value = false;
  });
  // 顺便刷新未读数
  refreshUnread();
}

function refreshUnread() {
  getUnreadCount().then(res => {
    unreadNum.value = res.data;
  });
}

function handleTabClick(tab) {
  queryParams.value.pageNum = 1;
  if (tab.paneName === 'all') queryParams.value.readFlag = null;
  if (tab.paneName === 'unread') queryParams.value.readFlag = '0';
  if (tab.paneName === 'read') queryParams.value.readFlag = '1';
  getList();
}

function handleRead(item) {
  if (item.readFlag === '1') return; // 已读的就不操作了
  readMessage(item.messageId).then(() => {
    item.readFlag = '1';
    refreshUnread(); // 刷新计数
  });
}

function handleReadAll() {
  proxy.$modal.confirm('确认要把所有消息标记为已读吗？').then(() => {
    return readAllMessage();
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("操作成功");
  });
}

function handleDelete(item) {
  proxy.$modal.confirm('确认删除这条消息吗？').then(() => {
    return delMessage(item.messageId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  });
}

function getIconClass(type) {
  return type === '1' ? 'icon-system' : 'icon-activity';
}

getList();
</script>

<style scoped lang="scss">
.message-container {
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
  padding: 20px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 20px;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #eee;
  
  .header-left {
    display: flex; align-items: center; gap: 15px;
    .title { font-size: 20px; font-weight: bold; color: #333; }
    .ml-2 { margin-left: 10px; }
  }
}

.message-tabs {
  background: #fff;
  padding: 0 20px;
  border-radius: 0 0 8px 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.msg-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid #409EFF; /* 未读默认蓝条 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  /* 已读样式 */
  &.is-read {
    border-left-color: #e4e7ed;
    opacity: 0.8;
    background: #fafafa;
    .msg-title { color: #666; font-weight: normal; }
  }
  
  .msg-icon {
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    flex-shrink: 0;
    
    &.icon-system { background: #E6A23C; } /* 系统通知：橙色 */
    &.icon-activity { background: #409EFF; } /* 活动提醒：蓝色 */
  }
  
  .msg-content {
    flex: 1;
    .msg-top {
      display: flex; justify-content: space-between; margin-bottom: 8px;
      .msg-title { font-size: 16px; font-weight: bold; color: #333; }
      .msg-time { font-size: 12px; color: #999; }
    }
    .msg-body {
      font-size: 14px; color: #666; line-height: 1.5;
    }
  }
  
  .msg-action {
    display: flex; align-items: center; justify-content: center;
    width: 30px;
    padding-top: 10px;
    
    .dot {
      width: 8px; height: 8px;
      background: #f56c6c;
      border-radius: 50%;
    }
  }
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>