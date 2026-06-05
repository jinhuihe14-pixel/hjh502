<template>
  <div class="commissions-page">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>佣金设置管理</span>
          <el-button type="primary" @click="showSettingDialog = true">
            <el-icon><Plus /></el-icon>
            新增设置
          </el-button>
        </div>
      </template>

      <el-table :data="commissionSettings" border>
        <el-table-column prop="position" label="职位" width="150">
          <template #default="{ row }">
            {{ positionMap[row.position] }}
          </template>
        </el-table-column>
        <el-table-column prop="commission_type" label="佣金类型" width="120">
          <template #default="{ row }">
            {{ commissionTypeMap[row.commission_type] }}
          </template>
        </el-table-column>
        <el-table-column prop="commission_rate" label="佣金比例(%)" width="150">
          <template #default="{ row }">
            {{ row.commission_type === 'percentage' || row.commission_type === 'rate' ? row.commission_rate : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="fixed_amount" label="固定金额" width="150">
          <template #default="{ row }">
            {{ row.commission_type === 'fixed' ? '¥' + row.fixed_amount : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editSetting(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="records-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>日佣金统计</span>
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="loadDailyCommissions"
          />
        </div>
      </template>

      <div class="summary-row">
        <div class="summary-item">
          <div class="summary-label">记录数</div>
          <div class="summary-value">{{ dailySummary.recordCount || 0 }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">关联金额</div>
          <div class="summary-value money">¥{{ dailySummary.totalAmount || 0 }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">佣金合计</div>
          <div class="summary-value money highlight">¥{{ dailySummary.totalCommission || 0 }}</div>
        </div>
      </div>

      <el-table :data="dailyCommissionRecords" border style="margin-top: 15px">
        <el-table-column prop="employee_name" label="员工姓名" width="140" />
        <el-table-column prop="position" label="职位" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.position === 'sales' ? 'primary' : 'success'">
              {{ positionMap[row.position] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="提成类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === 'card' ? 'warning' : 'info'">
              {{ typeMap[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="关联订单金额" width="140">
          <template #default="{ row }">
            ¥{{ row.amount }}
          </template>
        </el-table-column>
        <el-table-column prop="commission_amount" label="提成金额" width="140">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: 500">¥{{ row.commission_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="180" />
      </el-table>
      <el-empty v-if="dailyCommissionRecords.length === 0" description="暂无数据" />
    </el-card>

    <el-dialog v-model="showSettingDialog" :title="isEditSetting ? '编辑佣金设置' : '新增佣金设置'" width="500px">
      <el-form :model="settingForm" label-width="100px">
        <el-form-item label="职位">
          <el-select v-model="settingForm.position" placeholder="请选择职位" :disabled="isEditSetting">
            <el-option label="销售" value="sales" />
            <el-option label="技师" value="technician" />
            <el-option label="经理" value="manager" />
          </el-select>
        </el-form-item>
        <el-form-item label="佣金类型">
          <el-radio-group v-model="settingForm.commission_type">
            <el-radio label="percentage">按比例</el-radio>
            <el-radio label="fixed">固定金额</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="settingForm.commission_type === 'percentage'" label="佣金比例">
          <el-input-number v-model="settingForm.commission_rate" :min="0" :max="100" :precision="2" />
          <span style="margin-left: 10px">%</span>
        </el-form-item>
        <el-form-item v-if="settingForm.commission_type === 'fixed'" label="固定金额">
          <el-input-number v-model="settingForm.fixed_amount" :min="0" :precision="2" />
          <span style="margin-left: 10px">元</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSettingDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSetting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getCommissionSettings,
  createCommissionSetting,
  updateCommissionSetting,
  getDailyCommissions
} from '@/api'
import dayjs from 'dayjs'

const positionMap = {
  sales: '销售',
  technician: '技师',
  manager: '经理',
  cashier: '收银'
}

const typeMap = {
  card: '办卡',
  product: '商品'
}

const commissionTypeMap = {
  percentage: '按比例',
  rate: '按比例',
  fixed: '固定金额'
}

const commissionSettings = ref([])
const dailyCommissionRecords = ref([])
const dailySummary = ref({})
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))

const showSettingDialog = ref(false)
const isEditSetting = ref(false)
const editSettingId = ref(null)

const settingForm = reactive({
  position: 'sales',
  commission_type: 'percentage',
  commission_rate: 5,
  fixed_amount: 0
})

const loadCommissionSettings = async () => {
  const res = await getCommissionSettings()
  if (res.success) {
    commissionSettings.value = res.data
  }
}

const loadDailyCommissions = async () => {
  if (!selectedDate.value) return
  const res = await getDailyCommissions(selectedDate.value)
  if (res.success) {
    dailyCommissionRecords.value = res.data.records || []
    dailySummary.value = {
      recordCount: res.data.recordCount || 0,
      totalAmount: res.data.totalAmount || 0,
      totalCommission: res.data.totalCommission || 0
    }
  }
}

const editSetting = (row) => {
  isEditSetting.value = true
  editSettingId.value = row.id
  Object.assign(settingForm, {
    position: row.position,
    commission_type: row.commission_type,
    commission_rate: row.commission_rate,
    fixed_amount: row.fixed_amount
  })
  showSettingDialog.value = true
}

const handleSaveSetting = async () => {
  try {
    if (isEditSetting.value) {
      await updateCommissionSetting(editSettingId.value, settingForm)
      ElMessage.success('编辑成功')
    } else {
      await createCommissionSetting(settingForm)
      ElMessage.success('新增成功')
    }
    showSettingDialog.value = false
    loadCommissionSettings()
    resetSettingForm()
  } catch (e) {}
}

const resetSettingForm = () => {
  isEditSetting.value = false
  editSettingId.value = null
  Object.assign(settingForm, {
    position: 'sales',
    commission_type: 'percentage',
    commission_rate: 5,
    fixed_amount: 0
  })
}

onMounted(() => {
  loadCommissionSettings()
  loadDailyCommissions()
})
</script>

<style scoped lang="scss">
.commissions-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .settings-card,
  .records-card {
    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .summary-row {
    display: flex;
    gap: 20px;
    margin-bottom: 10px;

    .summary-item {
      flex: 1;
      padding: 15px 20px;
      background: #f5f7fa;
      border-radius: 8px;
      text-align: center;

      .summary-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 8px;
      }

      .summary-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;

        &.money {
          font-size: 22px;
        }

        &.highlight {
          color: #F56C6C;
        }
      }
    }
  }
}
</style>
