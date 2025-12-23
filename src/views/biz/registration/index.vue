<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="活动ID" prop="activityId">
        <el-input v-model="queryParams.activityId" placeholder="请输入活动ID" clearable @keyup.enter="handleQuery"/>
      </el-form-item>
      <el-form-item label="学生姓名" prop="userName">
        <el-input v-model="queryParams.userName" placeholder="请输入学生姓名" clearable @keyup.enter="handleQuery"/>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="待审核" value="0" />
          <el-option label="已报名" value="1" />
          <el-option label="已签到" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" size="small" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" size="small" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" size="small" @click="handleAdd">新增报名</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" size="small" :disabled="multiple" @click="handleDelete">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" size="small" @click="handleExport">导出</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="registrationList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="报名ID" align="center" prop="regId" />
      <el-table-column label="活动名称" align="center" prop="activityName" />
      <el-table-column label="用户ID" align="center" prop="userId" />
      <el-table-column label="姓名" align="center" prop="userName" />
      <el-table-column label="院系" align="center" prop="deptName" />
      
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
           <el-tag v-if="scope.row.status === '1'" type="success">已报名</el-tag>
           <el-tag v-else-if="scope.row.status === '2'" type="info">已签到</el-tag>
           <el-tag v-else-if="scope.row.status === '0'" type="warning">待审核</el-tag>
           <el-tag v-else type="danger">未知</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="报名时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button 
            v-if="scope.row.status === '0'"
            size="small" 
            type="text" 
            icon="Check" 
            @click="handleAudit(scope.row)"
          >通过</el-button>

          <el-button 
            v-if="scope.row.status === '1'"
            size="small" 
            type="text" 
            icon="CircleCheck" 
            @click="handleCheckIn(scope.row)"
          >签到</el-button>

          <el-button size="small" type="text" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
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

    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="活动ID" prop="activityId">
          <el-input v-model="form.activityId" placeholder="请输入要报名的活动ID" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 【重要】引入 updateRegistration 用于审核
import { listRegistration, delRegistration, addRegistration, checkInUser, updateRegistration } from "@/api/biz/registration";

export default {
  name: "Registration",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 报名记录表格数据
      registrationList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        activityId: null,
        userName: null,
        status: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        activityId: [
          { required: true, message: "活动ID不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询报名记录列表 */
    getList() {
      this.loading = true;
      listRegistration(this.queryParams).then(response => {
        this.registrationList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        regId: null,
        activityId: null,
        status: "0"
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.regId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "模拟报名 (测试)";
    },
    
    /** 【新增】审核通过按钮操作 */
    handleAudit(row) {
      const regId = row.regId;
      const userName = row.userName || '该学生';
      this.$modal.confirm('确认通过学生 "' + userName + '" 的报名申请吗？').then(function() {
        // 更新状态为 1 (已报名)
        return updateRegistration({ regId: regId, status: '1' });
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核通过");
      }).catch(() => {});
    },

    /** 删除按钮操作 */
    handleDelete(row) {
      const regIds = row.regId || this.ids;
      this.$modal.confirm('是否确认删除报名编号为"' + regIds + '"的数据项？').then(function() {
        return delRegistration(regIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },

    /** 签到按钮操作 */
    handleCheckIn(row) {
      const activityId = row.activityId;
      this.$prompt('请输入签到码', "活动签到", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /\S/,
        inputErrorMessage: "签到码不能为空"
      }).then(({ value }) => {
        const data = {
          activityId: activityId,
          remark: value
        };
        checkInUser(data).then(response => {
          this.$modal.msgSuccess("签到成功");
          this.getList(); 
        });
      }).catch(() => {
      });
    },

    /** 导出按钮操作 */
    handleExport() {
      this.download('biz/registration/export', {
        ...this.queryParams
      }, `registration_${new Date().getTime()}.xlsx`)
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
            addRegistration(this.form).then(response => {
              this.$modal.msgSuccess("报名成功");
              this.open = false;
              this.getList();
            });
        }
      });
    }
  }
};
</script>