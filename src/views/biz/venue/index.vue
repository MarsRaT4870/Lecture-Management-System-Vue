<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch">
      <el-form-item label="场地名称" prop="venueName">
        <el-input
          v-model="queryParams.venueName"
          placeholder="请输入场地名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="场地状态" clearable>
          <el-option label="正常" value="1" />
          <el-option label="停用" value="0" />
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
        v-hasPermi="['biz:venue:add']"
      >新增</el-button>
      <el-button
        type="danger"
        plain
        icon="Delete"
        :disabled="multiple"
        @click="handleDelete"
        v-hasPermi="['biz:venue:remove']"
      >删除</el-button>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="venueList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" prop="venueId" width="80" />
      <el-table-column label="场地名称" prop="venueName" />
      <el-table-column label="位置" prop="location" />
      <el-table-column label="容纳人数" prop="capacity" width="100" />
      <el-table-column label="设施描述" prop="description" :show-overflow-tooltip="true" />
      <el-table-column label="状态" align="center" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '1'" type="success">正常</el-tag>
          <el-tag v-else type="danger">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['biz:venue:edit']"
          >修改</el-button>
          <el-button
            link
            type="primary"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['biz:venue:remove']"
          >删除</el-button>
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

    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="venueRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="场地名称" prop="venueName">
          <el-input v-model="form.venueName" placeholder="如：第一报告厅" />
        </el-form-item>
        <el-form-item label="具体位置" prop="location">
          <el-input v-model="form.location" placeholder="如：图书馆一楼" />
        </el-form-item>
        <el-form-item label="容纳人数" prop="capacity">
          <el-input-number v-model="form.capacity" :min="1" :max="10000" />
        </el-form-item>
        <el-form-item label="场地状态">
          <el-radio-group v-model="form.status">
            <el-radio label="1">正常</el-radio>
            <el-radio label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="设施描述">
          <el-input v-model="form.description" type="textarea" placeholder="如：投影仪、音响、空调..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Venue">
import { listVenue, addVenue, updateVenue, delVenue } from "@/api/biz/venue";
import { getCurrentInstance, ref, reactive } from 'vue';

const { proxy } = getCurrentInstance();

const venueList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

// 【关键修复1】使用 ref 独立定义 form，避免响应式丢失
const form = ref({
  venueId: null,
  venueName: '',
  location: '',
  capacity: 100,
  status: '1',
  description: ''
});

// 【关键修复2】queryParams 单独定义
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  venueName: undefined,
  status: undefined
});

const rules = reactive({
  venueName: [{ required: true, message: "场地名称不能为空", trigger: "blur" }],
  location: [{ required: true, message: "位置不能为空", trigger: "blur" }],
  capacity: [{ required: true, message: "容量不能为空", trigger: "blur" }]
});

function getList() {
  loading.value = true;
  listVenue(queryParams.value).then(response => {
    venueList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

function cancel() {
  open.value = false;
  reset();
}

// 【关键修复3】重置表单时，直接修改 value，保证数据类型正确
function reset() {
  form.value = {
    venueId: null,
    venueName: null,
    location: null,
    capacity: 100,
    status: '1', // 确保这里是字符串 '1'，与 el-radio label="1" 对应
    description: null
  };
  proxy.resetForm("venueRef");
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
  ids.value = selection.map(item => item.venueId);
  multiple.value = !selection.length;
}

function handleAdd() {
  reset();
  open.value = true;
  title.value = "新增场地";
}

function handleUpdate(row) {
  reset();
  form.value = { ...row }; // 拷贝行数据
  open.value = true;
  title.value = "修改场地";
}

function submitForm() {
  proxy.$refs["venueRef"].validate(valid => {
    if (valid) {
      if (form.value.venueId != null) {
        updateVenue(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addVenue(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

function handleDelete(row) {
  const venueIds = row.venueId || ids.value;
  proxy.$modal.confirm('是否确认删除？').then(function() {
    return delVenue(venueIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

getList();
</script>