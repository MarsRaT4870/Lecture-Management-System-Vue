<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="活动主题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入活动主题"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="活动类型" prop="activityType">
        <el-select v-model="queryParams.activityType" placeholder="请选择类型" clearable>
          <el-option label="学术讲座" value="1" />
          <el-option label="校园活动" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="显示状态" prop="visible">
        <el-select v-model="queryParams.visible" placeholder="全部" clearable style="width: 120px">
          <el-option label="显示中" value="1" />
          <el-option label="已归档" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-button
        type="primary"
        plain
        icon="Plus"
        @click="handleAdd"
        v-hasPermi="['biz:activity:add']"
      >申报活动</el-button>
      <el-button
        type="danger"
        plain
        icon="Delete"
        :disabled="multiple"
        @click="handleDelete"
        v-hasPermi="['biz:activity:remove']"
      >删除</el-button>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="activityList" @selection-change="handleSelectionChange" class="common-table">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" prop="activityId" width="60" align="center" />
      
      <el-table-column label="主题" prop="title" min-width="150" :show-overflow-tooltip="true">
        <template #default="scope">
          <span style="font-weight: 500">{{ scope.row.title }}</span>
        </template>
      </el-table-column>
      
      <el-table-column label="主讲/负责" prop="speaker" width="100" />
      
      <el-table-column label="时间安排" align="left" width="240">
        <template #default="scope">
          <div class="time-cell">
            <div class="time-row">
              <span class="label">开始:</span> 
              <span class="value">{{ parseTime(scope.row.startTime) }}</span>
            </div>
            <div class="time-row">
              <span class="label">截止:</span>
              <span class="value" :class="new Date(scope.row.regDeadline) < new Date() ? 'text-expired' : 'text-normal'">
                {{ parseTime(scope.row.regDeadline) }}
              </span>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="地点" prop="location" width="120" :show-overflow-tooltip="true" />
      
      <el-table-column label="人数" prop="maxPeople" width="80" align="center">
        <template #default="scope">
          {{ scope.row.maxPeople === 0 ? '不限' : scope.row.maxPeople }}
        </template>
      </el-table-column>
      
      <el-table-column label="状态" align="center" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.visible === '0'" type="info" effect="dark">已归档</el-tag>
          <div v-else>
             <el-tag v-if="scope.row.auditStatus === '0'" type="warning">待审核</el-tag>
             <el-tag v-else-if="scope.row.auditStatus === '3'" type="danger">已驳回</el-tag>
             <el-tag v-else-if="scope.row.status === '2'" type="danger" effect="plain">已结束</el-tag>
             <el-tag v-else type="success">进行中</el-tag>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:activity:edit']">修改</el-button>
          
          <el-button link type="success" icon="Check" @click="handleAudit(scope.row)" v-if="scope.row.auditStatus === '0'" v-hasPermi="['biz:activity:audit']">审核</el-button>

          <el-tooltip 
            content="活动将在结束一周后自动下架归档，点击可立即归档" 
            placement="top" 
            effect="dark"
            v-if="scope.row.status === '2' && scope.row.visible !== '0'"
          >
            <el-button 
              link 
              type="warning" 
              icon="Download" 
              @click="handleArchive(scope.row)" 
              v-hasPermi="['biz:activity:remove']"
            >下架</el-button>
          </el-tooltip>

          <el-button link type="primary" icon="FullScreen" @click="handleQrCode(scope.row)" v-if="scope.row.status === '1'">签到码</el-button>
          
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:activity:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog :title="title" v-model="open" width="650px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="活动主题" prop="title">
          <el-input v-model="form.title" placeholder="请输入活动主题" />
        </el-form-item>
        
        <el-row>
          <el-col :span="12">
            <el-form-item label="活动类型" prop="activityType">
              <el-select v-model="form.activityType" style="width: 100%">
                <el-option label="学术讲座" value="1" />
                <el-option label="校园活动" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申报主体" prop="applicantType">
              <el-select v-model="form.applicantType" style="width: 100%">
                <el-option label="校内部门" value="1" />
                <el-option label="教师个人" value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="主讲人/负责人" prop="speaker">
          <el-input v-model="form.speaker" placeholder="姓名" style="width: 45%" />
          <el-input v-model="form.speakerTitle" placeholder="职称 (如: 教授)" style="width: 50%; margin-left: 10px" />
        </el-form-item>
        
        <el-form-item label="活动地点" prop="venueId">
          <el-select 
            v-model="form.venueId" 
            placeholder="请选择场地" 
            style="width: 100%" 
            filterable
            @change="handleVenueChange"
          >
            <el-option
              v-for="venue in venueOptions"
              :key="venue.venueId"
              :label="venue.venueName + ' (容纳' + venue.capacity + '人)'"
              :value="venue.venueId"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="活动时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="必须提前一周申报"
            style="width: 100%"
            :disabled-date="disabledDate"
            :default-value="defaultDate"
            @change="handleStartTimeChange"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="结束时间"
            style="width: 100%"
            :disabled-date="disabledDate"
            :default-value="defaultDate"
          />
        </el-form-item>
        
        <el-form-item label="报名截止" prop="regDeadline">
          <el-date-picker
            v-model="form.regDeadline"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="默认为开始前2小时"
            style="width: 100%"
            :disabled-date="disabledDate"
            :default-value="defaultDate"
          />
          <div class="form-tips" style="color: #999; font-size: 12px; line-height: 1.5;">
            * 报名截止时间必须至少比活动开始时间早 2 小时
          </div>
        </el-form-item>
        
        <el-form-item label="最大人数" prop="maxPeople">
          <el-input-number 
            v-model="form.maxPeople" 
            :min="1" 
            :max="currentVenueCapacity" 
            label="人数限制" 
            style="width: 180px"
          />
          <span class="ml10" style="color: #666; font-size: 13px;" v-if="currentVenueCapacity < 9999">
             (场地最大容量: {{currentVenueCapacity}} 人)
          </span>
        </el-form-item>
        
        <el-form-item label="活动简介" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入活动详细介绍..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog title="现场签到二维码" v-model="qrVisible" width="350px" center append-to-body>
      <div style="text-align: center;">
        <vue-qr :text="qrCodeText" :size="250"></vue-qr>
        <p class="mt10" style="color: #666">请学生扫码签到</p>
        <el-button type="primary" link @click="refreshQrCode(null)">刷新二维码</el-button>
      </div>
    </el-dialog>

    <el-dialog title="活动审核" v-model="auditOpen" width="500px" append-to-body>
      <el-form ref="auditFormRef" :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio label="2">通过</el-radio>
            <el-radio label="3">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input 
            v-model="auditForm.remark" 
            type="textarea" 
            placeholder="请输入审核意见（驳回必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitAudit">确 定</el-button>
          <el-button @click="auditOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Activity">
import { listActivity, getActivity, delActivity, addActivity, updateActivity, getActivityQrCode, auditActivity } from "@/api/biz/activity";
import { listAllVenue } from "@/api/biz/venue";
import { parseTime } from "@/utils/ruoyi";
import request from '@/utils/request'
import VueQr from 'vue-qr/src/packages/vue-qr.vue';
import { getCurrentInstance, reactive, ref, toRefs, computed } from 'vue';

const { proxy } = getCurrentInstance();

const activityList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const qrVisible = ref(false);
const qrCodeText = ref("");
const venueOptions = ref([]);

const auditOpen = ref(false);
const auditForm = ref({});
const currentVenueCapacity = ref(9999);

// 【核心修复】计算 7 天后的时间对象
const sevenDaysFromNow = new Date();
sevenDaysFromNow.setTime(sevenDaysFromNow.getTime() + 3600 * 1000 * 24 * 7);

// 1. 设置日历打开时的默认显示日期（自动跳到7天后）
const defaultDate = ref(sevenDaysFromNow);

// 2. 日期禁用逻辑：小于 (当前时间+7天) 的日期全部置灰
const disabledDate = (time) => {
  // 获取7天后的零点时间戳，确保比较准确
  const minDate = new Date();
  minDate.setTime(minDate.getTime() + 3600 * 1000 * 24 * 7);
  minDate.setHours(0, 0, 0, 0); // 从当天的0点开始算有效
  
  return time.getTime() < minDate.getTime();
};

function archiveActivity(activityId) {
  return request({ url: '/biz/activity/archive/' + activityId, method: 'put' })
}

const validateStartTime = (rule, value, callback) => {
  if (!value) {
    callback(new Error("开始时间不能为空"));
    return;
  }
  const inputTime = new Date(value).getTime();
  const now = new Date().getTime();
  const sevenDaysLater = now + (7 * 24 * 3600 * 1000) - 60000; // 允许1分钟误差

  if (inputTime < sevenDaysLater) {
    callback(new Error("根据规定，活动必须提前至少一周(7天)进行申报"));
  } else {
    callback();
  }
};

const validateEndTime = (rule, value, callback) => {
  if (!value) callback(new Error("结束时间不能为空"));
  else if (form.value.startTime && new Date(value) <= new Date(form.value.startTime)) callback(new Error("结束时间必须晚于开始时间"));
  else callback();
};

const validateRegDeadline = (rule, value, callback) => {
  if (!form.value.startTime) { callback(); return; }
  const startTime = new Date(form.value.startTime).getTime();
  const limitTime = startTime - 7200000; 
  if (value && new Date(value).getTime() > limitTime) callback(new Error("报名截止时间必须至少提前 2 小时！"));
  else callback();
};

const data = reactive({
  form: {
    activityId: undefined, title: undefined, activityType: undefined, applicantType: undefined,
    speaker: undefined, speakerTitle: undefined, venueId: undefined, location: undefined,
    startTime: undefined, endTime: undefined, regDeadline: undefined, maxPeople: 200,
    description: undefined, status: '0', visible: '1', remark: undefined
  },
  queryParams: { pageNum: 1, pageSize: 10, title: null, activityType: null, visible: null },
  rules: {
    title: [{ required: true, message: "必填", trigger: "blur" }],
    speaker: [{ required: true, message: "必填", trigger: "blur" }],
    venueId: [{ required: true, message: "必填", trigger: "change" }],
    startTime: [{ required: true, validator: validateStartTime, trigger: "change" }],
    endTime: [{ required: true, validator: validateEndTime, trigger: "change" }],
    regDeadline: [{ validator: validateRegDeadline, trigger: "change" }], 
    maxPeople: [{ required: true, message: "必填", trigger: "blur" }]
  }
});

const { queryParams, form, rules } = toRefs(data);

function getList() {
  loading.value = true;
  listActivity(queryParams.value).then(response => {
    activityList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

function getVenueOptions() { listAllVenue().then(res => { venueOptions.value = res.data; }); }

function handleVenueChange(val) {
  const selectedVenue = venueOptions.value.find(item => item.venueId === val);
  if (selectedVenue) {
    form.value.location = selectedVenue.venueName;
    currentVenueCapacity.value = selectedVenue.capacity;
    if (form.value.maxPeople > selectedVenue.capacity) form.value.maxPeople = selectedVenue.capacity;
  } else {
    currentVenueCapacity.value = 9999;
  }
}

function handleStartTimeChange(val) {
  if (val) {
    const startTimestamp = new Date(val).getTime();
    const deadlineTimestamp = startTimestamp - 7200000;
    form.value.regDeadline = parseTime(deadlineTimestamp);
  }
}

function cancel() { open.value = false; reset(); }

function reset() {
  form.value = {
    activityId: undefined, title: undefined, activityType: "1", applicantType: "1",
    speaker: undefined, speakerTitle: undefined, venueId: undefined, location: undefined,
    startTime: undefined, endTime: undefined, regDeadline: undefined, maxPeople: 200,
    description: undefined, status: "0", visible: "1", remark: undefined
  };
  currentVenueCapacity.value = 9999;
  proxy.resetForm("formRef");
}

function handleQuery() { queryParams.value.pageNum = 1; getList(); }
function resetQuery() { proxy.resetForm("queryForm"); handleQuery(); }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.activityId); single.value = selection.length != 1; multiple.value = !selection.length; }
function handleAdd() { reset(); open.value = true; title.value = "申报新活动"; }

function handleUpdate(row) {
  reset();
  const activityId = row.activityId || ids.value;
  getActivity(activityId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改活动";
    if (form.value.venueId) {
      const v = venueOptions.value.find(item => item.venueId === form.value.venueId);
      if (v) currentVenueCapacity.value = v.capacity;
    }
  });
}

function handleArchive(row) {
  proxy.$modal.confirm('确认要下架活动《' + row.title + '》吗？下架后活动将归档，不再在大厅显示。').then(() => archiveActivity(row.activityId)).then(() => {
    getList(); proxy.$modal.msgSuccess("下架归档成功");
  });
}

function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      if (form.value.activityId != null) {
        updateActivity(form.value).then(() => { proxy.$modal.msgSuccess("修改成功"); open.value = false; getList(); });
      } else {
        addActivity(form.value).then(() => { proxy.$modal.msgSuccess("申报成功"); open.value = false; getList(); });
      }
    }
  });
}

function handleDelete(row) {
  const activityIds = row.activityId || ids.value;
  proxy.$modal.confirm('确认删除？').then(() => delActivity(activityIds)).then(() => { getList(); proxy.$modal.msgSuccess("删除成功"); });
}

function handleQrCode(row) { qrVisible.value = true; form.value.activityId = row.activityId; refreshQrCode(row.activityId); }
function refreshQrCode(id) { getActivityQrCode(id || form.value.activityId).then(res => { qrCodeText.value = res.msg; }); }
function handleAudit(row) { auditForm.value = { activityId: row.activityId, auditStatus: "2", remark: "" }; auditOpen.value = true; }
function submitAudit() {
  if (auditForm.value.auditStatus === '3' && !auditForm.value.remark) { proxy.$modal.msgError("驳回必填意见"); return; }
  auditActivity(auditForm.value).then(() => { proxy.$modal.msgSuccess("审核完成"); auditOpen.value = false; getList(); });
}

getList();
getVenueOptions();
</script>

<style scoped>
.app-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #333;
}
.common-table {
  font-size: 14px;
}
.time-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.time-row {
  display: flex;
  align-items: center;
  font-size: 13px;
}
.time-row .label {
  color: #909399;
  width: 36px;
  text-align: right;
  margin-right: 6px;
}
.time-row .value {
  font-family: Consolas, Monaco, monospace;
}
.text-expired { color: #f56c6c; }
.text-normal { color: #606266; }
</style>