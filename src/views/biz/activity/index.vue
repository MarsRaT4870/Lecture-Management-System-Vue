<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryFormRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="活动标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="请输入活动标题" clearable @keyup.enter="handleQuery"/>
      </el-form-item>
      <el-form-item label="主讲人" prop="speaker">
        <el-input v-model="queryParams.speaker" placeholder="请输入主讲人" clearable @keyup.enter="handleQuery"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">删除</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="activityList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="activityId" />
      <el-table-column label="标题" align="center" prop="title" />
      <el-table-column label="主讲人" align="center" prop="speaker" />
      <el-table-column label="地点" align="center" prop="location" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '0'" type="success">正常</el-tag>
          <el-tag v-else type="danger">关闭</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" align="center" prop="startTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.startTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="签到码" align="center" prop="checkinCode">
         <template #default="scope">
           <el-tag v-if="scope.row.checkinCode">{{ scope.row.checkinCode }}</el-tag>
           <span v-else>-</span>
         </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Plus" @click="handleJoin(scope.row)">我要报名</el-button>
          
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="activityFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="活动标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入活动标题" />
        </el-form-item>
        <el-form-item label="主讲人" prop="speaker">
          <el-input v-model="form.speaker" placeholder="请输入主讲人" />
        </el-form-item>
        <el-form-item label="主讲简介" prop="speakerInfo">
          <el-input v-model="form.speakerInfo" type="textarea" placeholder="请输入主讲人简介" />
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入活动地点" />
        </el-form-item>
        
        <el-form-item label="签到码" prop="checkinCode">
           <el-input v-model="form.checkinCode" placeholder="请输入签到码" />
        </el-form-item>

        <el-form-item label="最大人数" prop="maxPeople">
          <el-input-number v-model="form.maxPeople" :min="1" label="最大人数"></el-input-number>
        </el-form-item>
        <el-form-item label="活动状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker clearable v-model="form.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择开始时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker clearable v-model="form.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择结束时间">
          </el-date-picker>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup name="Activity">
import { listActivity, getActivity, delActivity, addActivity, updateActivity } from "@/api/biz/activity";
// 【新增】引入报名接口
import { addRegistration } from "@/api/biz/registration";
import { getCurrentInstance, reactive, ref, toRefs } from 'vue';

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

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: null,
    speaker: null,
  },
  rules: {
    title: [
      { required: true, message: "活动标题不能为空", trigger: "blur" }
    ],
    startTime: [
      { required: true, message: "开始时间不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询活动列表 */
function getList() {
  loading.value = true;
  listActivity(queryParams.value).then(response => {
    activityList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    activityId: null,
    title: null,
    speaker: null,
    speakerInfo: null,
    location: null,
    checkinCode: null, // 重置签到码
    startTime: null,
    endTime: null,
    maxPeople: 50,
    status: "0"
  };
  proxy.resetForm("activityFormRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryFormRef");
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.activityId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加活动";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _activityId = row.activityId || ids.value;
  getActivity(_activityId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改活动";
  });
}

/** 【新增】立即报名按钮操作 */
function handleJoin(row) {
  const activityId = row.activityId;
  const activityTitle = row.title;
  
  proxy.$modal.confirm('确认要报名参加活动 "' + activityTitle + '" 吗？').then(function() {
    // 构造参数，后端会自动提取当前登录用户的 userId
    return addRegistration({ activityId: activityId });
  }).then(() => {
    proxy.$modal.msgSuccess("报名成功！请前往[报名管理]查看详情");
  }).catch(() => {
    // 取消也不做任何事
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["activityFormRef"].validate(valid => {
    if (valid) {
      if (form.value.activityId != null) {
        updateActivity(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addActivity(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _activityIds = row.activityId || ids.value;
  proxy.$modal.confirm('是否确认删除活动编号为"' + _activityIds + '"的数据项？').then(function() {
    return delActivity(_activityIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

getList();
</script>