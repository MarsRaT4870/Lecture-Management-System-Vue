<template>
  <div class="notify-container">
    <el-popover
      placement="bottom"
      trigger="click"
      width="300"
      popper-class="notify-popper"
      @show="refreshData"
    >
      <template #reference>
        <div class="bell-wrapper">
          <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0" class="badge-item">
            <el-icon :size="20"><Bell /></el-icon>
          </el-badge>
        </div>
      </template>

      <div class="pop-header">
        <span>站内通知</span>
        <el-button link type="primary" size="small" @click="toCenter">查看全部</el-button>
      </div>
      <div class="pop-list" v-loading="loading">
        <div v-if="list.length === 0" class="empty-tips">暂无未读消息</div>
        <div 
          v-else
          class="pop-item" 
          v-for="item in list" 
          :key="item.messageId"
          @click="readOne(item)"
        >
          <div class="title-row">
            <span class="dot" v-if="item.readFlag === '0'"></span>
            <span class="title text-ellipsis">{{ item.title }}</span>
          </div>
          <div class="time">{{ parseTime(item.createTime, '{m}-{d} {h}:{i}') }}</div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { getUnreadCount, listMessage, readMessage } from "@/api/biz/message";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { parseTime } from "@/utils/ruoyi";
import { Bell } from '@element-plus/icons-vue';

const router = useRouter();
const unreadCount = ref(0);
const list = ref([]);
const loading = ref(false);

function refreshData() {
  getUnreadCount().then(res => unreadCount.value = res.data);
  loading.value = true;
  // 只查前5条未读
  listMessage({ pageNum: 1, pageSize: 5, readFlag: '0' }).then(res => {
    list.value = res.rows;
    loading.value = false;
  });
}

function readOne(item) {
  readMessage(item.messageId).then(() => {
    refreshData(); // 刷新
    router.push('/message'); // 跳转到消息中心
  });
}

function toCenter() {
  router.push('/message');
}

onMounted(() => {
  // 初始化时获取一次数量
  getUnreadCount().then(res => unreadCount.value = res.data);
});
</script>

<style scoped>
.bell-wrapper {
  padding: 0 10px; cursor: pointer; height: 100%; display: flex; align-items: center; justify-content: center;
  color: #5a5e66;
  transition: background .3s;
  min-width: 40px;
}
.bell-wrapper:hover { background: rgba(0,0,0,0.025); }

.pop-header { 
  display: flex; justify-content: space-between; align-items: center; 
  padding-bottom: 10px; border-bottom: 1px solid #eee; margin-bottom: 5px; 
  font-weight: bold; font-size: 14px;
}

.pop-list { max-height: 300px; overflow-y: auto; }

.pop-item { 
  padding: 10px 0; border-bottom: 1px solid #f5f5f5; cursor: pointer; 
}
.pop-item:hover { background: #fafafa; }

.title-row { display: flex; align-items: center; margin-bottom: 5px; }
.title-row .dot { width: 6px; height: 6px; background: #f56c6c; border-radius: 50%; margin-right: 6px; }
.title-row .title { font-size: 14px; color: #333; flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

.pop-item .time { font-size: 12px; color: #999; margin-left: 12px; }

.empty-tips { text-align: center; color: #999; padding: 20px 0; font-size: 12px; }
</style>