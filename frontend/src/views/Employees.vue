<template>
  <div class="employees-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>员工列表</span>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            新增员工
          </el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索员工姓名、工号、电话"
          clearable
          style="width: 300px"
          @keyup.enter="loadEmployees"
        />
        <el-button type="primary" @click="loadEmployees">搜索</el-button>
      </div>

      <el-table :data="employees" border>
        <el-table-column prop="employee_no" label="工号" width="150" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="position" label="职位" width="120">
          <template #default="{ row }">
            {{ getPositionLabel(row.position) }}
          </template>
        </el-table-column>
        <el-table-column prop="base_salary" label="基本工资" width="120">
          <template #default="{ row }">
            ¥{{ row.base_salary }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editEmployee(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadEmployees"
        @current-change="loadEmployees"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="showAddDialog" :title="isEdit ? '编辑员工' : '新增员工'" width="500px">
      <el-form :model="employeeForm" label-width="100px">
        <el-form-item label="工号">
          <el-input v-model="employeeForm.employee_no" placeholder="请输入工号" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="employeeForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="employeeForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="职位">
          <el-select v-model="employeeForm.position" placeholder="请选择职位" style="width: 100%">
            <el-option label="销售" value="sales" />
            <el-option label="技师" value="technician" />
            <el-option label="经理" value="manager" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="基本工资">
          <el-input-number v-model="employeeForm.base_salary" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="employeeForm.status">
            <el-radio label="active">在职</el-radio>
            <el-radio label="inactive">离职</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getEmployees, createEmployee, updateEmployee } from '@/api'

const employees = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')

const showAddDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const employeeForm = reactive({
  employee_no: '',
  name: '',
  phone: '',
  position: 'sales',
  base_salary: 0,
  status: 'active'
})

const positionMap = {
  sales: '销售',
  technician: '技师',
  manager: '经理',
  other: '其他'
}

const getPositionLabel = (position) => {
  return positionMap[position] || position
}

const loadEmployees = async () => {
  const res = await getEmployees({
    keyword: searchKeyword.value,
    page: currentPage.value,
    pageSize: pageSize.value
  })
  if (res.success) {
    employees.value = res.data
    total.value = res.total
  }
}

const editEmployee = (row) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(employeeForm, {
    employee_no: row.employee_no,
    name: row.name,
    phone: row.phone,
    position: row.position,
    base_salary: row.base_salary,
    status: row.status
  })
  showAddDialog.value = true
}

const handleSave = async () => {
  try {
    if (isEdit.value) {
      await updateEmployee(editId.value, employeeForm)
      ElMessage.success('编辑成功')
    } else {
      await createEmployee(employeeForm)
      ElMessage.success('新增成功')
    }
    showAddDialog.value = false
    loadEmployees()
    resetForm()
  } catch (e) {}
}

const resetForm = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(employeeForm, {
    employee_no: '',
    name: '',
    phone: '',
    position: 'sales',
    base_salary: 0,
    status: 'active'
  })
}

onMounted(() => {
  loadEmployees()
})
</script>

<style scoped lang="scss">
.employees-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .search-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
}
</style>
