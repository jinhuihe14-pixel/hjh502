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
            {{ row.commission_type === 'rate' ? row.commission_rate : '-' }}
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

    <el-card class="statistics-card" style="margin-top: 20px">
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

      <el-tabs v-model="activeTab">
        <el-tab-pane label="销售佣金" name="sales">
          <el-table :data="dailySalesCommissions" border>
            <el-table-column prop="employee_name" label="员工姓名" width="150" />
            <el-table-column prop="card_count" label="办卡数量" width="120" />
            <el-table-column prop="total_sales" label="业绩金额" width="150">
              <template #default="{ row }">
                ¥{{ row.total_sales || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="commission" label="佣金金额" width="150">
              <template #default="{ row }">
                ¥{{ row.commission || 0 }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="dailySalesCommissions.length === 0" description="暂无数据" />
        </el-tab-pane>

        <el-tab-pane label="技师佣金" name="technicians">
          <el-table :data="dailyTechnicianCommissions" border>
            <el-table-column prop="employee_name" label="员工姓名" width="150" />
            <el-table-column prop="product_count" label="服务数量" width="120" />
            <el-table-column prop="total_sales" label="业绩金额" width="150">
              <template #default="{ row }">
                ¥{{ row.total_sales || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="commission" label="佣金金额" width="150">
              <template #default="{ row }">
                ¥{{ row.commission || 0 }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="dailyTechnicianCommissions.length === 0" description="暂无数据" />
        </el-tab-pane>
      </el-tabs>
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
            <el-radio label="rate">按比例</el-radio>
            <el-radio label="fixed">固定金额</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="settingForm.commission_type === 'rate'" label="佣金比例">
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
  manager: '经理'
}

const commissionTypeMap = {
  rate: '按比例',
  fixed: '固定金额'
}

const commissionSettings = ref([])
const dailySalesCommissions = ref([])
const dailyTechnicianCommissions = ref([])
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const activeTab = ref('sales')

const showSettingDialog = ref(false)
const isEditSetting = ref(false)
const editSettingId = ref(null)

const settingForm = reactive({
  position: 'sales',
  commission_type: 'rate',
  commission_rate: 10,
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
    dailySalesCommissions.value = res.data.sales || []
    dailyTechnicianCommissions.value = res.data.technicians || []
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
    commission_type: 'rate',
    commission_rate: 10,
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
  .statistics-card {
    :deep(.el-card__body) {
      padding: 20px;
    }
  }
}
</style>
