<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch">
      <el-form-item label="活动名称" prop="activityName">
        <el-input v-model="queryParams.activityName" placeholder="输入活动名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['biz:evaluation:remove']">删除</el-button>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="evaluationList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      
      <el-table-column label="活动主题" prop="activityName" min-width="150" :show-overflow-tooltip="true" />
      
      <el-table-column label="评价人" prop="userName" width="100" align="center">
        <template #default="scope">
          {{ scope.row.isAnonymous === '1' ? '匿名用户' : scope.row.userName }}
        </template>
      </el-table-column>

      <el-table-column label="综合评分" prop="score" width="180" align="center">
        <template #default="scope">
          <el-rate v-model="scope.row.score" disabled show-score text-color="#ff9900" score-template="{value}分" />
        </template>
      </el-table-column>

      <el-table-column label="评分详情" width="100" align="center">
        <template #default="scope">
          <el-popover effect="light" trigger="hover" placement="top" width="200">
            <template #default>
              <div class="score-detail-pop">
                <p>内容: <span class="score">{{ scope.row.scoreContent || '-' }}</span></p>
                <p>讲师: <span class="score">{{ scope.row.scoreSpeaker || '-' }}</span></p>
                <p>环境: <span class="score">{{ scope.row.scoreEnv || '-' }}</span></p>
              </div>
            </template>
            <template #reference>
              <el-tag type="info" size="small">查看</el-tag>
            </template>
          </el-popover>
        </template>
      </el-table-column>

      <el-table-column label="印象标签" prop="tags" min-width="150">
        <template #default="scope">
          <div v-if="scope.row.tags">
            <el-tag 
              v-for="(tag, index) in parseTags(scope.row.tags)" 
              :key="index" 
              size="small" 
              class="mr-5"
            >{{ tag }}</el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="评价内容" prop="comment" min-width="200" :show-overflow-tooltip="true" />

      <el-table-column label="官方回复" prop="replyContent" min-width="150">
        <template #default="scope">
          <span v-if="scope.row.replyContent" class="text-success">{{ scope.row.replyContent }}</span>
          <span v-else class="text-muted">暂无回复</span>
        </template>
      </el-table-column>

      <el-table-column label="评价时间" prop="createTime" width="160" align="center">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="ChatLineRound" @click="handleReply(scope.row)" v-hasPermi="['biz:evaluation:edit']">回复</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:evaluation:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="官方回复" v-model="replyOpen" width="500px" append-to-body>
      <el-form :model="replyForm" label-width="80px">
        <el-form-item label="学生评价">
          <div class="user-comment-box">{{ replyForm.userComment }}</div>
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input v-model="replyForm.replyContent" type="textarea" :rows="4" placeholder="请输入官方回复..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitReply">确 定</el-button>
          <el-button @click="replyOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Evaluation">
import { listEvaluation, delEvaluation, replyEvaluation } from "@/api/biz/evaluation";
import { getCurrentInstance, ref, reactive, toRefs } from 'vue';
import { parseTime } from "@/utils/ruoyi";

const { proxy } = getCurrentInstance();

const evaluationList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const multiple = ref(true);
const total = ref(0);

const replyOpen = ref(false);
const replyForm = ref({});

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    activityName: null
  }
});

const { queryParams } = toRefs(data);

function getList() {
  loading.value = true;
  listEvaluation(queryParams.value).then(response => {
    evaluationList.value = response.rows || [];
    total.value = response.total || 0;
    loading.value = false;
  }).catch(err => {
    console.error('获取评价列表失败', err);
    proxy.$modal.msgError('获取评价列表失败，请稍后重试');
    loading.value = false;
  });
}

// 解析 JSON 标签字符串
function parseTags(jsonStr) {
  try {
    const arr = JSON.parse(jsonStr);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

function resetQuery() {
  proxy.resetForm("queryForm");
  handleQuery();
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.evalId);
  multiple.value = !selection.length;
}

function handleDelete(row) {
  const evalIds = row.evalId || ids.value;
  proxy.$modal.confirm('是否确认删除？').then(function() {
    return delEvaluation(evalIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(err => {
    proxy.$modal.msgError(err.msg || '删除失败，请稍后重试');
  });
}

// 打开回复弹窗
function handleReply(row) {
  replyForm.value = {
    evalId: row.evalId,
    userComment: row.comment,
    replyContent: row.replyContent || ''
  };
  replyOpen.value = true;
}

// 提交回复
function submitReply() {
  if (!replyForm.value.replyContent) {
    proxy.$modal.msgWarning("回复内容不能为空");
    return;
  }
  replyEvaluation({ 
    evalId: replyForm.value.evalId, 
    replyContent: replyForm.value.replyContent 
  }).then(() => {
    proxy.$modal.msgSuccess("回复成功");
    replyOpen.value = false;
    getList();
  }).catch(err => {
    proxy.$modal.msgError(err.msg || "回复失败，该功能后端尚未实现");
  });
}

getList();
</script>

<style scoped>
.mr-5 { margin-right: 5px; margin-bottom: 2px; }
.score-detail-pop p { margin: 0; line-height: 24px; font-size: 13px; }
.score-detail-pop .score { color: #ff9900; font-weight: bold; float: right; }
.user-comment-box {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
  width: 100%;
}
.text-success { color: #67C23A; }
.text-muted { color: #909399; font-size: 12px; }
</style>