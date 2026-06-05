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
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleWalkIn(row)">散客入场</el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSessionsByDate, updateSession, walkInPurchase } from '@/api'

const selectedDate = ref('')
const sessions = ref([])
const loading = ref(false)
const showWalkInDialog = ref(false)
const currentSession = ref(null)

const walkInForm = reactive({
  count: 1,
  amount: 0
})

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
      count: walkInForm.count,
      amount: walkInForm.amount
    })
    ElMessage.success('散客入场成功')
    showWalkInDialog.value = false
    loadSessions()
  } catch (e) {
    ElMessage.error('操作失败')
  }
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
}
</style>
