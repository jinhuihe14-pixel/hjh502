<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon icon-member">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ overview?.memberCount || 0 }}</div>
            <div class="stat-label">会员总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon icon-card">
            <el-icon><CreditCard /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ overview?.activeCardCount || 0 }}</div>
            <div class="stat-label">有效会员卡</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon icon-order">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ overview?.todayOrderCount || 0 }}</div>
            <div class="stat-label">今日订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon icon-money">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ overview?.todaySalesAmount || 0 }}</div>
            <div class="stat-label">今日营收</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="14">
        <el-card>
          <template #header>
            <span>今日场次客流</span>
          </template>
          <div class="sessions-list">
            <div v-for="session in todaySessions" :key="session.id" class="session-item">
              <div class="session-info">
                <span class="session-name">{{ session.session_name }}</span>
                <span class="session-time">{{ session.start_time }} - {{ session.end_time }}</span>
              </div>
              <div class="session-progress">
                <el-progress 
                  :percentage="Math.round((session.current_count / session.max_capacity) * 100)"
                  :color="getProgressColor(session.current_count, session.max_capacity)"
                />
                <span class="session-count">{{ session.current_count }}/{{ session.max_capacity }}人</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>
            <span>今日新增</span>
          </template>
          <div class="today-stats">
            <div class="today-stat-item">
              <div class="today-stat-value" style="color: #409EFF">{{ overview?.todayNewMembers || 0 }}</div>
              <div class="today-stat-label">新增会员</div>
            </div>
            <div class="today-stat-item">
              <div class="today-stat-value" style="color: #67C23A">{{ overview?.todayNewCards || 0 }}</div>
              <div class="today-stat-label">新增办卡</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOverview, getTodaySessions } from '@/api'

const overview = ref(null)
const todaySessions = ref([])

const loadData = async () => {
  const [overviewRes, sessionsRes] = await Promise.all([
    getOverview(),
    getTodaySessions()
  ])
  
  if (overviewRes.success) {
    overview.value = overviewRes.data
  }
  if (sessionsRes.success) {
    todaySessions.value = sessionsRes.data
  }
}

const getProgressColor = (current, max) => {
  const ratio = current / max
  if (ratio >= 0.9) return '#F56C6C'
  if (ratio >= 0.7) return '#E6A23C'
  return '#67C23A'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.dashboard {
  .stat-cards {
    margin-bottom: 20px;
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    gap: 15px;
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: #fff;
      
      &.icon-member { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      &.icon-card { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
      &.icon-order { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
      &.icon-money { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
    }
    
    .stat-content {
      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
      }
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 5px;
      }
    }
  }
  
  .content-row {
    .sessions-list {
      .session-item {
        padding: 15px 0;
        border-bottom: 1px solid #ebeef5;
        
        &:last-child {
          border-bottom: none;
        }
        
        .session-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          
          .session-name {
            font-weight: 500;
            color: #303133;
          }
          .session-time {
            color: #909399;
            font-size: 14px;
          }
        }
        
        .session-progress {
          display: flex;
          align-items: center;
          gap: 15px;
          
          .el-progress {
            flex: 1;
          }
          
          .session-count {
            font-size: 14px;
            color: #606266;
            min-width: 80px;
            text-align: right;
          }
        }
      }
    }
    
    .today-stats {
      display: flex;
      justify-content: space-around;
      padding: 20px 0;
      
      .today-stat-item {
        text-align: center;
        
        .today-stat-value {
          font-size: 36px;
          font-weight: bold;
        }
        
        .today-stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 5px;
        }
      }
    }
  }
}
</style>
