<template>
  <div class="salary-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>薪资管理</span>
          <div class="header-actions">
            <el-date-picker
              v-model="selectedMonth"
              type="month"
              placeholder="选择月份"
              format="YYYY-MM"
              value-format="YYYY-MM"
              style="width: 180px; margin-right: 10px"
              @change="loadSalaryRecords"
            />
            <el-button type="primary" @click="handleGenerateSalary">
              <el-icon><Plus /></el-icon>
              生成薪资
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="salaryRecords" border>
        <el-table-column prop="employee_name" label="员工姓名" width="120" />
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column prop="base_salary" label="基本工资" width="120">
          <template #default="{ row }">
            ¥{{ formatNumber(row.base_salary) }}
          </template>
        </el-table-column>
        <el-table-column prop="card_commission" label="办卡提成" width="120">
          <template #default="{ row }">
            ¥{{ formatNumber(row.card_commission) }}
          </template>
        </el-table-column>
        <el-table-column prop="product_commission" label="商品提成" width="120">
          <template #default="{ row }">
            ¥{{ formatNumber(row.product_commission) }}
          </template>
        </el-table-column>
        <el-table-column prop="bonus" label="奖金" width="100">
          <template #default="{ row }">
            ¥{{ formatNumber(row.bonus) }}
          </template>
        </el-table-column>
        <el-table-column prop="deduction" label="扣款" width="100">
          <template #default="{ row }">
            ¥{{ formatNumber(row.deduction) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_salary" label="实发工资" width="120">
          <template #default="{ row }">
            <span class="total-salary">¥{{ formatNumber(row.total_salary) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'locked' ? 'success' : 'info'">
              {{ row.status === 'locked' ? '已锁定' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :disabled="row.status === 'locked'"
              @click="editSalary(row)"
            >
              编辑
            </el-button>
            <el-button
              type="warning"
              link
              :disabled="row.status === 'locked'"
              @click="handleLockSalary(row.id)"
            >
              锁定
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="salaryRecords.length === 0" description="暂无薪资数据，请先生成薪资" />
    </el-card>

    <el-dialog v-model="showEditDialog" title="编辑薪资" width="500px">
      <el-form :model="salaryForm" label-width="100px">
        <el-form-item label="员工姓名">
          <el-input v-model="salaryForm.employee_name" disabled />
        </el-form-item>
        <el-form-item label="基本工资">
          <el-input v-model="salaryForm.base_salary" disabled>
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="办卡提成">
          <el-input v-model="salaryForm.card_commission" disabled>
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="商品提成">
          <el-input v-model="salaryForm.product_commission" disabled>
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="奖金">
          <el-input-number v-model="salaryForm.bonus" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="扣款">
          <el-input-number v-model="salaryForm.deduction" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="实发工资">
          <el-input :value="calculateTotal" disabled>
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateSalary">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { generateSalary, getSalaryRecords, updateSalary, lockSalary } from '@/api'

const salaryRecords = ref([])
const selectedMonth = ref('')

const showEditDialog = ref(false)
const editId = ref(null)

const salaryForm = reactive({
  employee_name: '',
  base_salary: 0,
  card_commission: 0,
  product_commission: 0,
  bonus: 0,
  deduction: 0
})

const calculateTotal = computed(() => {
  return (
    Number(salaryForm.base_salary) +
    Number(salaryForm.card_commission) +
    Number(salaryForm.product_commission) +
    Number(salaryForm.bonus) -
    Number(salaryForm.deduction)
  )
})

const formatNumber = (num) => {
  return Number(num || 0).toFixed(2)
}

const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const loadSalaryRecords = async () => {
  if (!selectedMonth.value) return
  const res = await getSalaryRecords(selectedMonth.value)
  if (res.success) {
    salaryRecords.value = res.data || []
  }
}

const handleGenerateSalary = async () => {
  if (!selectedMonth.value) {
    ElMessage.warning('请先选择月份')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要生成 ${selectedMonth.value} 月份的薪资吗？`,
      '确认生成',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await generateSalary(selectedMonth.value)
    if (res.success) {
      ElMessage.success('薪资生成成功')
      loadSalaryRecords()
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '生成失败')
    }
  }
}

const editSalary = (row) => {
  editId.value = row.id
  Object.assign(salaryForm, {
    employee_name: row.employee_name,
    base_salary: row.base_salary,
    card_commission: row.card_commission,
    product_commission: row.product_commission,
    bonus: row.bonus || 0,
    deduction: row.deduction || 0
  })
  showEditDialog.value = true
}

const handleUpdateSalary = async () => {
  try {
    const res = await updateSalary(editId.value, {
      bonus: salaryForm.bonus,
      deduction: salaryForm.deduction
    })
    if (res.success) {
      ElMessage.success('更新成功')
      showEditDialog.value = false
      loadSalaryRecords()
    }
  } catch (e) {}
}

const handleLockSalary = async (id) => {
  try {
    await ElMessageBox.confirm(
      '锁定后将无法修改薪资数据，确定要锁定吗？',
      '确认锁定',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await lockSalary(id)
    if (res.success) {
      ElMessage.success('锁定成功')
      loadSalaryRecords()
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '锁定失败')
    }
  }
}

onMounted(() => {
  selectedMonth.value = getCurrentMonth()
  loadSalaryRecords()
})
</script>

<style scoped lang="scss">
.salary-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-actions {
    display: flex;
    align-items: center;
  }

  .total-salary {
    font-weight: bold;
    color: #f56c6c;
  }
}
</style>
