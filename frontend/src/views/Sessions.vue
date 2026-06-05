<template>
  <div class="sessions-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>场次管理</span>
        </div>
      </template>

      <div class="date-bar">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="loadSessions"
        />
        <el-button type="primary" @click="loadSessions">查询</el-button>
      </div>

      <el-table :data="sessions" border style="width: 100%">
        <el-table-column prop="session_name" label="场次名称" width="150" />
        <el-table-column prop="start_time" label="开始时间" width="120">
          <template #default="{ row }">
            {{ formatTime(row.start_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="end_time" label="结束时间" width="120">
          <template #default="{ row }">
            {{ formatTime(row.end_time) }}
          </template>
        </el-table-column>
        <el-table-column label="当前人数" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-warning': isCapacityWarning(row), 'text-danger': isCapacityFull(row) }">
              {{ row.current_count || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="最大容量" width="180">
          <template #default="{ row }">
            <el-input-number
              v-model="row.max_capacity"
              :min="1"
              :max="999"
              size="small"
              @change="handleCapacityChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="客流进度" width="250">
          <template #default="{ row }">
            <div class="progress-wrapper">
              <el-progress
                :percentage="getProgressPercentage(row)"
                :color="getProgressColor(row)"
                :stroke-width="12"
              />
              <span class="progress-text">
                {{ row.current_count || 0 }} / {{ row.max_capacity }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleWalkIn(row)">散客入场</el-button>
            <el-button type="success" link @click="handleViewTickets(row)">入场记录</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="sessions.length === 0 && !loading" description="当日暂无场次" style="margin-top: 40px" />
    </el-card>

    <el-dialog v-model="showWalkInDialog" title="散客入场" width="400px">
      <el-form :model="walkInForm" label-width="80px">
        <el-form-item label="场次名称">
          <span>{{ currentSession?.session_name }}</span>
        </el-form-item>
        <el-form-item label="人数">
          <el-input-number v-model="walkInForm.count" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="walkInForm.amount" :min="0" :precision="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWalkInDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmWalkIn">确认入场</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showTicketsDialog" title="入场记录" width="800px">
      <div class="tickets-dialog-header">
        <span class="session-name">{{ currentSession?.session_name }}</span>
        <span class="session-date">{{ selectedDate }}</span>
      </div>
      <el-table :data="sessionTickets" border style="width: 100%">
        <el-table-column prop="ticket_no" label="票号" width="180" />
        <el-table-column label="票种" width="150">
          <template #default="{ row }">
            {{ row.card_type_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="入场人数" width="100" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'valid' ? 'success' : 'info'" size="small">
              {{ row.status === 'valid' ? '有效' : '已退票' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="购票时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              link
              :disabled="row.status !== 'valid'"
              @click="handleRefundTicket(row)"
            >
              退票
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="sessionTickets.length === 0" description="暂无购票记录" style="padding: 40px 0" />
      <template #footer>
        <el-button @click="showTicketsDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRefundConfirm" title="确认退票" width="400px">
      <div class="refund-confirm-content">
        <el-icon :size="40" color="#E6A23C"><WarningFilled /></el-icon>
        <p>确定要退票吗？退票后将退回 {{ refundingTicket?.quantity }} 人入场名额，退款 ¥{{ refundingTicket?.amount }}。</p>
      </div>
      <template #footer>
        <el-button @click="showRefundConfirm = false">取消</el-button>
        <el-button type="danger" @click="confirmRefundTicket">确认退票</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import {
  getSessionsByDate,
  updateSession,
  walkInPurchase,
  getSessionTickets,
  refundTicket
} from '@/api'

const selectedDate = ref('')
const sessions = ref([])
const loading = ref(false)
const showWalkInDialog = ref(false)
const currentSession = ref(null)

const walkInForm = reactive({
  count: 1,
  amount: 0
})

const showTicketsDialog = ref(false)
const sessionTickets = ref([])

const showRefundConfirm = ref(false)
const refundingTicket = ref(null)

const formatDate = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatTime = (time) => {
  if (!time) return ''
  if (time.length >= 5) {
    return time.substring(0, 5)
  }
  return time
}

const loadSessions = async () => {
  if (!selectedDate.value) return
  loading.value = true
  try {
    const res = await getSessionsByDate(selectedDate.value)
    if (res.success) {
      sessions.value = res.data || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleCapacityChange = async (row) => {
  try {
    await updateSession(row.id, { max_capacity: row.max_capacity })
    ElMessage.success('容量更新成功')
  } catch (e) {
    ElMessage.error('容量更新失败')
    loadSessions()
  }
}

const getProgressPercentage = (row) => {
  const current = row.current_count || 0
  const max = row.max_capacity || 1
  const percentage = Math.round((current / max) * 100)
  return Math.min(percentage, 100)
}

const getProgressColor = (row) => {
  const percentage = getProgressPercentage(row)
  if (percentage >= 100) return '#f56c6c'
  if (percentage >= 80) return '#e6a23c'
  return '#67c23a'
}

const isCapacityWarning = (row) => {
  const percentage = getProgressPercentage(row)
  return percentage >= 80 && percentage < 100
}

const isCapacityFull = (row) => {
  return getProgressPercentage(row) >= 100
}

const handleWalkIn = (row) => {
  currentSession.value = row
  walkInForm.count = 1
  walkInForm.amount = 0
  showWalkInDialog.value = true
}

const confirmWalkIn = async () => {
  if (!currentSession.value) return
  try {
    await walkInPurchase({
      session_id: currentSession.value.id,
      quantity: walkInForm.count,
      amount: walkInForm.amount
    })
    ElMessage.success('散客入场成功')
    showWalkInDialog.value = false
    loadSessions()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleViewTickets = async (row) => {
  currentSession.value = row
  sessionTickets.value = []
  showTicketsDialog.value = true
  
  try {
    const res = await getSessionTickets(row.id)
    if (res.success) {
      sessionTickets.value = res.data || []
    }
  } catch (e) {
    ElMessage.error('加载入场记录失败')
  }
}

const handleRefundTicket = (ticket) => {
  refundingTicket.value = ticket
  showRefundConfirm.value = true
}

const confirmRefundTicket = async () => {
  if (!refundingTicket.value) return
  
  try {
    const res = await refundTicket(refundingTicket.value.ticket_no)
    if (res.success) {
      ElMessage.success('退票成功')
      showRefundConfirm.value = false
      
      const idx = sessionTickets.value.findIndex(t => t.id === refundingTicket.value.id)
      if (idx > -1) {
        sessionTickets.value[idx].status = 'refunded'
      }
      
      loadSessions()
    }
  } catch (e) {}
}

onMounted(() => {
  selectedDate.value = formatDate(new Date())
  loadSessions()
})
</script>

<style scoped lang="scss">
.sessions-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .date-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .progress-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 8px;
  }

  .progress-text {
    font-size: 12px;
    color: #606266;
    white-space: nowrap;
  }

  .text-warning {
    color: #e6a23c;
    font-weight: bold;
  }

  .text-danger {
    color: #f56c6c;
    font-weight: bold;
  }
  
  .tickets-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
    
    .session-name {
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }
    
    .session-date {
      font-size: 14px;
      color: #909399;
    }
  }
  
  .refund-confirm-content {
    text-align: center;
    padding: 20px 0;
    
    .el-icon {
      margin-bottom: 15px;
    }
    
    p {
      color: #606266;
      line-height: 1.6;
    }
  }
}
</style>
